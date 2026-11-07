import { NextRequest, NextResponse } from 'next/server';
import {
  STELLAR_CONFIG,
  isValidStellarPublicKey,
  verifyLabasTrustline,
  submitLabasPayment,
  parseStellarError,
  validateIssuerConfig,
} from '@/lib/stellar';

export const runtime = 'nodejs';

export const XP_PER_LABAS_TOKEN = 100;
export const MIN_CLAIMABLE_XP = 500;
const CLAIM_LOCK_TTL_MS = 60 * 1000;
const CLAIM_COOLDOWN_MS = 10 * 1000;

// In-process concurrency lock to block simultaneous duplicate requests for the same UID
const globalWithClaimLocks = globalThis as unknown as {
  __labasActiveClaimLocks?: Map<string, number>;
};
const activeClaimLocks: Map<string, number> =
  globalWithClaimLocks.__labasActiveClaimLocks || new Map<string, number>();
globalWithClaimLocks.__labasActiveClaimLocks = activeClaimLocks;

interface VerifiedFirebaseUser {
  uid: string;
  email: string;
}

/**
 * Verifies a Firebase Auth ID token via Google Identity Toolkit REST API.
 */
async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || !idToken) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        cache: 'no-store',
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const account = data?.users?.[0];
    if (!account?.localId) return null;

    return {
      uid: String(account.localId),
      email: String(account.email || ''),
    };
  } catch (error) {
    console.error('[CLAIM_XP_AUTH_VERIFY_ERROR]:', error instanceof Error ? error.message : error);
    return null;
  }
}

// Helper to parse Firestore REST API Value objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return undefined;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const out: Record<string, unknown> = {};
    const fields = val.mapValue.fields || {};
    for (const k of Object.keys(fields)) {
      out[k] = fromFirestoreValue(fields[k]);
    }
    return out;
  }
  return undefined;
}

// Helper to encode JS primitives/objects into Firestore REST API Value objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFirestoreValue(val: any): Record<string, any> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

interface FirestoreUserDoc {
  exists: boolean;
  name: string;
  updateTime?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawFields: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

async function fetchUserFirestoreDoc(
  projectId: string,
  uid: string,
  idToken: string
): Promise<FirestoreUserDoc> {
  const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;

  const res = await fetch(docUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: 'no-store',
  });

  const docName = `projects/${projectId}/databases/(default)/documents/users/${uid}`;

  if (res.status === 404) {
    return {
      exists: false,
      name: docName,
      rawFields: {},
      data: {},
    };
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to read user profile from Firestore (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const rawFields = json.fields || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsedData: Record<string, any> = {};
  for (const key of Object.keys(rawFields)) {
    parsedData[key] = fromFirestoreValue(rawFields[key]);
  }

  return {
    exists: true,
    name: json.name || docName,
    updateTime: json.updateTime,
    rawFields,
    data: parsedData,
  };
}

/**
 * Atomic conditional update on users/{uid} using Firestore commit precondition (updateTime)
 * to acquire or release the claim lock and prevent race conditions across serverless instances.
 */
async function acquireFirestoreClaimLock(params: {
  projectId: string;
  uid: string;
  email: string;
  idToken: string;
  userDoc: FirestoreUserDoc;
  xpBalance: number;
  lifetimeXpEarned: number;
  streakDays: number;
  stellarPublicKey: string;
}): Promise<{ acquired: boolean; updateTime?: string }> {
  const {
    projectId,
    uid,
    email,
    idToken,
    userDoc,
    xpBalance,
    lifetimeXpEarned,
    streakDays,
    stellarPublicKey,
  } = params;

  const commitUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/(default)/documents:commit`;

  const nowIso = new Date().toISOString();
  const updatedFields = {
    ...userDoc.rawFields,
    uid: toFirestoreValue(uid),
    email: toFirestoreValue(email),
    stellarPublicKey: toFirestoreValue(stellarPublicKey),
    xpBalance: toFirestoreValue(xpBalance),
    lifetimeXpEarned: toFirestoreValue(lifetimeXpEarned),
    streakDays: toFirestoreValue(streakDays),
    claimInProgress: toFirestoreValue(true),
    claimLockTimestamp: toFirestoreValue(nowIso),
  };

  const currentDocument = userDoc.exists && userDoc.updateTime
    ? { updateTime: userDoc.updateTime }
    : { exists: false };

  const res = await fetch(commitUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      writes: [
        {
          update: {
            name: userDoc.name,
            fields: updatedFields,
          },
          currentDocument,
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    return { acquired: false };
  }

  const commitResult = await res.json();
  const newUpdateTime = commitResult?.writeResults?.[0]?.updateTime;
  return { acquired: true, updateTime: newUpdateTime };
}

async function releaseFirestoreClaimLock(params: {
  projectId: string;
  uid: string;
  idToken: string;
}): Promise<void> {
  const { projectId, uid, idToken } = params;
  const patchUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/(default)/documents/users/${encodeURIComponent(
    uid
  )}?updateMask.fieldPaths=claimInProgress`;

  try {
    await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          claimInProgress: toFirestoreValue(false),
        },
      }),
      cache: 'no-store',
    });
  } catch {
    // Non-fatal cleanup
  }
}

/**
 * GET /api/rewards/claim-xp?publicKey=G...
 * Checks Stellar Mainnet network config and verifies whether a wallet has an active $LABAS trustline.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publicKey = searchParams.get('publicKey')?.trim() || '';

  const issuerConfigured = isValidStellarPublicKey(STELLAR_CONFIG.issuerPublicKey);

  if (!publicKey) {
    return NextResponse.json({
      network: STELLAR_CONFIG.network,
      serverUrl: STELLAR_CONFIG.serverUrl,
      assetCode: STELLAR_CONFIG.assetCode,
      issuerPublicKey: issuerConfigured ? STELLAR_CONFIG.issuerPublicKey : null,
      issuerConfigured,
      conversionRate: {
        xpPerToken: XP_PER_LABAS_TOKEN,
        minClaimableXp: MIN_CLAIMABLE_XP,
      },
    });
  }

  if (!isValidStellarPublicKey(publicKey)) {
    return NextResponse.json(
      {
        validAddress: false,
        hasTrustline: false,
        errorCode: 'invalid_destination',
        message:
          'Invalid Stellar Mainnet public key. Address must be 56 characters starting with "G".',
        assetCode: STELLAR_CONFIG.assetCode,
        issuerPublicKey: issuerConfigured ? STELLAR_CONFIG.issuerPublicKey : null,
      },
      { status: 400 }
    );
  }

  if (!issuerConfigured) {
    return NextResponse.json({
      validAddress: true,
      hasTrustline: false,
      issuerConfigured: false,
      errorCode: 'issuer_not_configured',
      message:
        'Wallet format is valid on Stellar Mainnet. Server ISSUER_PUBLIC_KEY is awaiting production key configuration.',
      assetCode: STELLAR_CONFIG.assetCode,
      issuerPublicKey: null,
    });
  }

  const trustResult = await verifyLabasTrustline(publicKey);
  return NextResponse.json({
    validAddress: true,
    issuerConfigured: true,
    ...trustResult,
  });
}

/**
 * POST /api/rewards/claim-xp
 * Authenticates the learner, validates XP balance >= 500 XP, checks Stellar Mainnet $LABAS trustline,
 * submits the $LABAS token transfer on Stellar Mainnet, atomically deducts XP, and records the audit trail.
 */
export async function POST(req: NextRequest) {
  let lockedUid: string | null = null;
  let firestoreLockAcquired = false;
  let activeIdToken = '';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'sekmes';

  try {
    const authHeader = req.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : '';

    const body = await req.json().catch(() => ({}));
    const idToken = bearerToken || (typeof body.idToken === 'string' ? body.idToken.trim() : '');
    activeIdToken = idToken;

    if (!idToken) {
      return NextResponse.json(
        {
          error: 'Authentication required. Please sign in to convert XP to $LABAS tokens.',
          errorCode: 'unauthenticated',
        },
        { status: 401 }
      );
    }

    // 1. Verify Firebase Auth Session Token
    const verifiedUser = await verifyFirebaseIdToken(idToken);
    if (!verifiedUser) {
      return NextResponse.json(
        {
          error: 'Invalid or expired authentication session. Please sign in again.',
          errorCode: 'invalid_token',
        },
        { status: 401 }
      );
    }

    const { uid, email } = verifiedUser;

    // 2. Check in-memory double-claim lock
    const existingLockTime = activeClaimLocks.get(uid);
    if (existingLockTime && Date.now() - existingLockTime < CLAIM_LOCK_TTL_MS) {
      return NextResponse.json(
        {
          error:
            'A $LABAS token claim is already in progress for your account. Please wait for ledger confirmation.',
          errorCode: 'claim_in_progress',
        },
        { status: 409 }
      );
    }
    activeClaimLocks.set(uid, Date.now());
    lockedUid = uid;

    // 3. Read User Document from Firestore
    const userDoc = await fetchUserFirestoreDoc(projectId, uid, idToken);
    const docData = userDoc.data || {};
    const nestedProgress =
      docData.progress && typeof docData.progress === 'object' ? docData.progress : {};

    // Check if another serverless instance holds an active claim lock in Firestore
    if (docData.claimInProgress === true && typeof docData.claimLockTimestamp === 'string') {
      const lockAge = Date.now() - new Date(docData.claimLockTimestamp).getTime();
      if (!Number.isNaN(lockAge) && lockAge < CLAIM_LOCK_TTL_MS) {
        return NextResponse.json(
          {
            error:
              'A $LABAS reward conversion is currently processing on the Stellar Mainnet. Please wait a moment.',
            errorCode: 'claim_in_progress',
          },
          { status: 409 }
        );
      }
    }

    // Check cooldown from lastClaimTimestamp to prevent rapid duplicate claims
    const lastClaimIso =
      typeof docData.lastClaimTimestamp === 'string'
        ? docData.lastClaimTimestamp
        : typeof nestedProgress.lastClaimTimestamp === 'string'
        ? nestedProgress.lastClaimTimestamp
        : null;

    if (lastClaimIso) {
      const timeSinceLastClaim = Date.now() - new Date(lastClaimIso).getTime();
      if (!Number.isNaN(timeSinceLastClaim) && timeSinceLastClaim < CLAIM_COOLDOWN_MS) {
        return NextResponse.json(
          {
            error: 'Please wait a few seconds between consecutive $LABAS token claims.',
            errorCode: 'claim_cooldown',
          },
          { status: 429 }
        );
      }
    }

    // Determine authoritative XP balance from Firestore (or initialize if first sync)
    const firestoreXpBalance =
      typeof docData.xpBalance === 'number'
        ? docData.xpBalance
        : typeof nestedProgress.xpBalance === 'number'
        ? nestedProgress.xpBalance
        : typeof nestedProgress.xp === 'number'
        ? nestedProgress.xp
        : typeof body.clientXpBalance === 'number' && !userDoc.exists
        ? Math.max(0, Math.floor(body.clientXpBalance))
        : 0;

    const lifetimeXpEarned = Math.max(
      typeof docData.lifetimeXpEarned === 'number' ? docData.lifetimeXpEarned : 0,
      typeof nestedProgress.lifetimeXpEarned === 'number' ? nestedProgress.lifetimeXpEarned : 0,
      firestoreXpBalance
    );

    const streakDays = Math.max(
      typeof docData.streakDays === 'number' ? docData.streakDays : 1,
      typeof nestedProgress.streak === 'number' ? nestedProgress.streak : 1
    );

    // Determine target Stellar Mainnet Public Key
    const requestedPublicKey =
      typeof body.stellarPublicKey === 'string' && body.stellarPublicKey.trim()
        ? body.stellarPublicKey.trim()
        : typeof docData.stellarPublicKey === 'string' && docData.stellarPublicKey.trim()
        ? docData.stellarPublicKey.trim()
        : typeof nestedProgress.stellarPublicKey === 'string' &&
          nestedProgress.stellarPublicKey.trim()
        ? nestedProgress.stellarPublicKey.trim()
        : '';

    if (!requestedPublicKey || !isValidStellarPublicKey(requestedPublicKey)) {
      return NextResponse.json(
        {
          error:
            'Please link a valid Stellar Mainnet wallet address (starting with "G") before converting XP to $LABAS.',
          errorCode: 'invalid_wallet_address',
        },
        { status: 400 }
      );
    }

    // 4. Threshold & Rate Calculation (100 XP = 1 $LABAS, minimum 500 XP)
    if (firestoreXpBalance < MIN_CLAIMABLE_XP) {
      return NextResponse.json(
        {
          error: `Minimum claimable threshold is ${MIN_CLAIMABLE_XP} XP (5 $LABAS). Your current balance is ${firestoreXpBalance} XP.`,
          errorCode: 'insufficient_xp',
          xpBalance: firestoreXpBalance,
          minRequiredXp: MIN_CLAIMABLE_XP,
        },
        { status: 400 }
      );
    }

    const requestedXp =
      typeof body.xpToConvert === 'number' && body.xpToConvert >= MIN_CLAIMABLE_XP
        ? Math.min(firestoreXpBalance, Math.floor(body.xpToConvert))
        : firestoreXpBalance;

    const xpToConvert = Math.floor(requestedXp / XP_PER_LABAS_TOKEN) * XP_PER_LABAS_TOKEN;
    if (xpToConvert < MIN_CLAIMABLE_XP) {
      return NextResponse.json(
        {
          error: `At least ${MIN_CLAIMABLE_XP} XP is required per conversion (100 XP = 1 $LABAS).`,
          errorCode: 'insufficient_xp',
          xpBalance: firestoreXpBalance,
        },
        { status: 400 }
      );
    }

    const tokenAmount = xpToConvert / XP_PER_LABAS_TOKEN;

    // 5. Validate Server Issuer Configuration & Verify Recipient Mainnet Trustline
    const issuerConfig = validateIssuerConfig();
    if (!issuerConfig.valid) {
      return NextResponse.json(
        {
          error: issuerConfig.message,
          errorCode: issuerConfig.errorCode,
        },
        { status: 503 }
      );
    }

    const trustlineStatus = await verifyLabasTrustline(requestedPublicKey);
    if (!trustlineStatus.hasTrustline) {
      return NextResponse.json(
        {
          error:
            trustlineStatus.message ||
            `Your Stellar wallet does not have an active trustline for $${STELLAR_CONFIG.assetCode}.`,
          errorCode: trustlineStatus.errorCode || 'op_no_trust',
          assetCode: STELLAR_CONFIG.assetCode,
          issuerPublicKey: STELLAR_CONFIG.issuerPublicKey,
        },
        { status: 400 }
      );
    }

    // 6. Acquire Atomic Firestore Lock BEFORE executing Stellar Mainnet transfer
    const lockRes = await acquireFirestoreClaimLock({
      projectId,
      uid,
      email,
      idToken,
      userDoc,
      xpBalance: firestoreXpBalance,
      lifetimeXpEarned,
      streakDays,
      stellarPublicKey: requestedPublicKey,
    });

    if (!lockRes.acquired) {
      return NextResponse.json(
        {
          error:
            'Concurrent balance update detected. Please wait a moment and try your claim again.',
          errorCode: 'concurrent_modification',
        },
        { status: 409 }
      );
    }
    firestoreLockAcquired = true;

    // 7. Execute Stellar Mainnet Transaction ($LABAS Transfer)
    let paymentResult;
    try {
      paymentResult = await submitLabasPayment({
        destinationPublicKey: requestedPublicKey,
        amount: tokenAmount,
        memoText: `LabasApp:${xpToConvert}XP`,
      });
    } catch (stellarErr: unknown) {
      // Release Firestore lock since Stellar transaction did not succeed
      await releaseFirestoreClaimLock({ projectId, uid, idToken });
      firestoreLockAcquired = false;

      const parsed = parseStellarError(stellarErr);
      return NextResponse.json(
        {
          error: parsed.userMessage,
          errorCode: parsed.errorCode,
          assetCode: STELLAR_CONFIG.assetCode,
          issuerPublicKey: STELLAR_CONFIG.issuerPublicKey,
        },
        { status: parsed.statusCode }
      );
    }

    // 8. State Atomicity: Deduct claimed XP and record audit trail in token_claims
    const newXpBalance = Math.max(0, firestoreXpBalance - xpToConvert);
    const claimTimestamp = new Date().toISOString();
    const claimId = `claim_${Date.now()}_${ paymentResult.hash.slice(0, 10) }`;
    const prevTotalClaimed =
      typeof docData.totalLabasClaimed === 'number'
        ? docData.totalLabasClaimed
        : typeof nestedProgress.totalLabasClaimed === 'number'
        ? nestedProgress.totalLabasClaimed
        : 0;
    const newTotalLabasClaimed = Number((prevTotalClaimed + tokenAmount).toFixed(4));

    const claimRecord = {
      id: claimId,
      uid,
      email,
      stellarPublicKey: requestedPublicKey,
      xpClaimed: xpToConvert,
      tokenAmount,
      assetCode: paymentResult.assetCode,
      transactionHash: paymentResult.hash,
      ledger: paymentResult.ledger,
      explorerUrl: paymentResult.explorerUrl,
      network: 'PUBLIC',
      timestamp: claimTimestamp,
    };

    const updatedNestedProgress = {
      ...nestedProgress,
      xp: newXpBalance,
      xpBalance: newXpBalance,
      lifetimeXpEarned,
      streak: streakDays,
      streakDays,
      stellarPublicKey: requestedPublicKey,
      lastClaimTimestamp: claimTimestamp,
      totalLabasClaimed: newTotalLabasClaimed,
    };

    const finalUserFields = {
      ...userDoc.rawFields,
      uid: toFirestoreValue(uid),
      email: toFirestoreValue(email),
      stellarPublicKey: toFirestoreValue(requestedPublicKey),
      xpBalance: toFirestoreValue(newXpBalance),
      lifetimeXpEarned: toFirestoreValue(lifetimeXpEarned),
      streakDays: toFirestoreValue(streakDays),
      lastClaimTimestamp: toFirestoreValue(claimTimestamp),
      totalLabasClaimed: toFirestoreValue(newTotalLabasClaimed),
      claimInProgress: toFirestoreValue(false),
      progress: toFirestoreValue(updatedNestedProgress),
    };

    const claimFirestoreFields = {
      id: toFirestoreValue(claimRecord.id),
      uid: toFirestoreValue(claimRecord.uid),
      email: toFirestoreValue(claimRecord.email),
      stellarPublicKey: toFirestoreValue(claimRecord.stellarPublicKey),
      xpClaimed: toFirestoreValue(claimRecord.xpClaimed),
      tokenAmount: toFirestoreValue(claimRecord.tokenAmount),
      assetCode: toFirestoreValue(claimRecord.assetCode),
      transactionHash: toFirestoreValue(claimRecord.transactionHash),
      ledger: toFirestoreValue(claimRecord.ledger || 0),
      explorerUrl: toFirestoreValue(claimRecord.explorerUrl),
      network: toFirestoreValue('PUBLIC'),
      timestamp: toFirestoreValue(claimRecord.timestamp),
    };

    const commitUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/(default)/documents:commit`;

    const subClaimDocName = `projects/${projectId}/databases/(default)/documents/users/${uid}/token_claims/${claimId}`;
    const topClaimDocName = `projects/${projectId}/databases/(default)/documents/token_claims/${claimId}`;

    await fetch(commitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: userDoc.name,
              fields: finalUserFields,
            },
          },
          {
            update: {
              name: subClaimDocName,
              fields: claimFirestoreFields,
            },
          },
          {
            update: {
              name: topClaimDocName,
              fields: claimFirestoreFields,
            },
          },
        ],
      }),
      cache: 'no-store',
    });

    firestoreLockAcquired = false;

    return NextResponse.json({
      success: true,
      transactionHash: paymentResult.hash,
      ledger: paymentResult.ledger,
      explorerUrl: paymentResult.explorerUrl,
      issuedTokenAmount: tokenAmount,
      xpClaimed: xpToConvert,
      updatedXpBalance: newXpBalance,
      lifetimeXpEarned,
      assetCode: paymentResult.assetCode,
      stellarPublicKey: requestedPublicKey,
      lastClaimTimestamp: claimTimestamp,
      claimRecord,
    });
  } catch (error: unknown) {
    console.error(
      '[CLAIM_XP_API_ERROR]:',
      error instanceof Error ? error.message : 'Unexpected error'
    );

    if (firestoreLockAcquired && lockedUid && activeIdToken) {
      await releaseFirestoreClaimLock({
        projectId,
        uid: lockedUid,
        idToken: activeIdToken,
      });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while processing your $LABAS token claim.',
        errorCode: 'internal_error',
      },
      { status: 500 }
    );
  } finally {
    if (lockedUid) {
      activeClaimLocks.delete(lockedUid);
    }
  }
}

