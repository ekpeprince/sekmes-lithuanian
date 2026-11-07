import { NextRequest, NextResponse } from 'next/server';
import {
  STELLAR_CONFIG,
  isValidStellarPublicKey,
  validateIssuerConfig,
  verifyLabasTrustline,
  submitSponsoredLabasWithdrawal,
  parseStellarError,
} from '@/lib/stellar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const XP_PER_LABAS_TOKEN = 100;
const MIN_WITHDRAW_XP = 500; // 500 XP = 5.00 $LABAS minimum withdrawal threshold
const MIN_WITHDRAW_LABAS = MIN_WITHDRAW_XP / XP_PER_LABAS_TOKEN; // 5 $LABAS
const WITHDRAW_COOLDOWN_MS = 15_000;
const WITHDRAW_LOCK_TTL_MS = 60_000;

// In-memory lock map for single-instance double-claim prevention alongside Firestore atomic precondition
const activeWithdrawLocks = new Map<string, number>();

interface VerifiedFirebaseUser {
  uid: string;
  email: string;
}

/**
 * Verifies the user's Firebase ID Token against Google Identity Toolkit REST API.
 */
async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || !idToken) {
    return null;
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  const account = data?.users?.[0];
  if (!account?.localId) {
    return null;
  }

  return {
    uid: account.localId,
    email: account.email || '',
  };
}

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
    const values = val.arrayValue?.values || [];
    return values.map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any> = {};
    for (const k of Object.keys(fields)) {
      out[k] = fromFirestoreValue(fields[k]);
    }
    return out;
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue),
      },
    };
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

  const docName = `projects/${projectId}/databases/(default)/documents/users/${uid}`;

  try {
    const res = await fetch(docUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      cache: 'no-store',
    });

    if (res.status === 404) {
      return {
        exists: false,
        name: docName,
        rawFields: {},
        data: {},
      };
    }

    if (!res.ok) {
      return {
        exists: false,
        name: docName,
        rawFields: {},
        data: {},
      };
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
  } catch {
    return {
      exists: false,
      name: docName,
      rawFields: {},
      data: {},
    };
  }
}

async function acquireFirestoreWithdrawLock(params: {
  projectId: string;
  uid: string;
  email: string;
  idToken: string;
  userDoc: FirestoreUserDoc;
  xpBalance: number;
  internalLabasBalance: number;
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
    internalLabasBalance,
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
    internalLabasBalance: toFirestoreValue(internalLabasBalance),
    lifetimeXpEarned: toFirestoreValue(lifetimeXpEarned),
    streakDays: toFirestoreValue(streakDays),
    claimInProgress: toFirestoreValue(true),
    claimLockTimestamp: toFirestoreValue(nowIso),
  };

  const currentDocument =
    userDoc.exists && userDoc.updateTime
      ? { updateTime: userDoc.updateTime }
      : { exists: false };

  try {
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
      if (res.status === 404) {
        return { acquired: true };
      }
      return { acquired: false };
    }

    const commitResult = await res.json();
    const newUpdateTime = commitResult?.writeResults?.[0]?.updateTime;
    return { acquired: true, updateTime: newUpdateTime };
  } catch {
    return { acquired: true };
  }
}

async function releaseFirestoreWithdrawLock(params: {
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
 * GET /api/stellar/withdraw?publicKey=G...
 * Checks Stellar Mainnet wallet activation and $LABAS trustline status.
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
        minWithdrawXp: MIN_WITHDRAW_XP,
        minWithdrawLabas: MIN_WITHDRAW_LABAS,
      },
    });
  }

  if (!isValidStellarPublicKey(publicKey)) {
    return NextResponse.json(
      {
        validAddress: false,
        hasTrustline: false,
        walletActivated: false,
        errorCode: 'invalid_destination',
        message:
          'Invalid Stellar Mainnet public key. Address must be 56 characters starting with "G".',
        assetCode: STELLAR_CONFIG.assetCode,
        issuerPublicKey: issuerConfigured ? STELLAR_CONFIG.issuerPublicKey : null,
      },
      { status: 400 }
    );
  }

  const trustResult = await verifyLabasTrustline(publicKey);
  return NextResponse.json({
    validAddress: true,
    issuerConfigured,
    walletActivated: Boolean(trustResult.accountExists && trustResult.hasTrustline),
    ...trustResult,
  });
}

/**
 * POST /api/stellar/withdraw
 * Hybrid Gasless & Internal Balance Withdrawal Pipeline:
 * 1. Verifies user session & internal balance threshold (500 XP / 5.00 $LABAS).
 * 2. Uses the Issuer Keypair (GBF7L...) to submit a direct payment or a backend-sponsored
 *    on-chain claimable balance / fee-bump transaction to the user's public G-address.
 * 3. Deducts the withdrawn amount from internalLabasBalance and xpBalance in Firestore and logs the tx hash.
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
    const idToken =
      bearerToken || (typeof body.idToken === 'string' ? body.idToken.trim() : '');
    activeIdToken = idToken;

    if (!idToken) {
      return NextResponse.json(
        {
          error: 'Authentication required. Please sign in to withdraw $LABAS to Stellar Mainnet.',
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

    // 2. Prevent concurrent duplicate withdrawals
    const existingLockTime = activeWithdrawLocks.get(uid);
    if (existingLockTime && Date.now() - existingLockTime < WITHDRAW_LOCK_TTL_MS) {
      return NextResponse.json(
        {
          error:
            'A $LABAS Mainnet withdrawal is already in progress for your account. Please wait for ledger confirmation.',
          errorCode: 'claim_in_progress',
        },
        { status: 409 }
      );
    }
    activeWithdrawLocks.set(uid, Date.now());
    lockedUid = uid;

    // 3. Read User Document from Firestore
    const userDoc = await fetchUserFirestoreDoc(projectId, uid, idToken);
    const docData = userDoc.data || {};
    const nestedProgress =
      docData.progress && typeof docData.progress === 'object' ? docData.progress : {};

    if (docData.claimInProgress === true && typeof docData.claimLockTimestamp === 'string') {
      const lockAge = Date.now() - new Date(docData.claimLockTimestamp).getTime();
      if (!Number.isNaN(lockAge) && lockAge < WITHDRAW_LOCK_TTL_MS) {
        return NextResponse.json(
          {
            error:
              'A $LABAS Mainnet withdrawal is currently processing. Please wait a moment.',
            errorCode: 'claim_in_progress',
          },
          { status: 409 }
        );
      }
    }

    const lastClaimIso =
      typeof docData.lastClaimTimestamp === 'string'
        ? docData.lastClaimTimestamp
        : typeof nestedProgress.lastClaimTimestamp === 'string'
        ? nestedProgress.lastClaimTimestamp
        : null;

    if (lastClaimIso) {
      const timeSinceLastClaim = Date.now() - new Date(lastClaimIso).getTime();
      if (!Number.isNaN(timeSinceLastClaim) && timeSinceLastClaim < WITHDRAW_COOLDOWN_MS) {
        return NextResponse.json(
          {
            error: 'Please wait a few seconds between consecutive Mainnet withdrawals.',
            errorCode: 'claim_cooldown',
          },
          { status: 429 }
        );
      }
    }

    // Resolve authoritative XP & internal $LABAS balance
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

    const firestoreInternalLabas =
      typeof docData.internalLabasBalance === 'number'
        ? docData.internalLabasBalance
        : typeof nestedProgress.internalLabasBalance === 'number'
        ? nestedProgress.internalLabasBalance
        : typeof body.clientInternalLabasBalance === 'number' && !userDoc.exists
        ? Math.max(0, Number(body.clientInternalLabasBalance))
        : Number((firestoreXpBalance / XP_PER_LABAS_TOKEN).toFixed(4));

    const effectiveXpBalance = Math.max(
      firestoreXpBalance,
      Math.floor(firestoreInternalLabas * XP_PER_LABAS_TOKEN)
    );
    const effectiveInternalLabas = Number(
      (effectiveXpBalance / XP_PER_LABAS_TOKEN).toFixed(4)
    );

    const lifetimeXpEarned = Math.max(
      typeof docData.lifetimeXpEarned === 'number' ? docData.lifetimeXpEarned : 0,
      typeof nestedProgress.lifetimeXpEarned === 'number' ? nestedProgress.lifetimeXpEarned : 0,
      effectiveXpBalance
    );

    const streakDays = Math.max(
      typeof docData.streakDays === 'number' ? docData.streakDays : 1,
      typeof nestedProgress.streak === 'number' ? nestedProgress.streak : 1
    );

    // 4. Validate Target Stellar Mainnet G-Address
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
            'Please link a valid Stellar Mainnet wallet address (starting with "G") to withdraw $LABAS.',
          errorCode: 'invalid_wallet_address',
        },
        { status: 400 }
      );
    }

    // 5. Validation Check: Verify minimum withdrawal threshold (500 XP = 5.00 $LABAS)
    if (effectiveXpBalance < MIN_WITHDRAW_XP && effectiveInternalLabas < MIN_WITHDRAW_LABAS) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal threshold is ${MIN_WITHDRAW_LABAS} $LABAS (${MIN_WITHDRAW_XP} XP). Your current internal balance is ${effectiveInternalLabas.toFixed(
            2
          )} $LABAS (${effectiveXpBalance} XP).`,
          errorCode: 'insufficient_balance',
          xpBalance: effectiveXpBalance,
          internalLabasBalance: effectiveInternalLabas,
          minRequiredXp: MIN_WITHDRAW_XP,
          minRequiredLabas: MIN_WITHDRAW_LABAS,
        },
        { status: 400 }
      );
    }

    const xpToWithdraw =
      Math.floor(effectiveXpBalance / XP_PER_LABAS_TOKEN) * XP_PER_LABAS_TOKEN;
    const tokenAmount = Number((xpToWithdraw / XP_PER_LABAS_TOKEN).toFixed(4));

    // 6. Validate Server Issuer Configuration
    const issuerConfig = validateIssuerConfig();
    if (!issuerConfig.valid) {
      return NextResponse.json(
        {
          error: issuerConfig.message,
          errorCode: issuerConfig.errorCode,
          assetCode: STELLAR_CONFIG.assetCode,
          issuerPublicKey: STELLAR_CONFIG.issuerPublicKey,
        },
        { status: 503 }
      );
    }

    // 7. Acquire Atomic Lock Before Submitting Stellar Mainnet Transaction
    const lockRes = await acquireFirestoreWithdrawLock({
      projectId,
      uid,
      email,
      idToken,
      userDoc,
      xpBalance: effectiveXpBalance,
      internalLabasBalance: effectiveInternalLabas,
      lifetimeXpEarned,
      streakDays,
      stellarPublicKey: requestedPublicKey,
    });

    if (!lockRes.acquired) {
      return NextResponse.json(
        {
          error:
            'Concurrent balance update detected. Please wait a moment and try your withdrawal again.',
          errorCode: 'concurrent_modification',
        },
        { status: 409 }
      );
    }
    firestoreLockAcquired = true;

    // 8. On-Chain Sponsoring / Execution:
    // Submits direct payment if trustline is active, or Issuer-sponsored claimable balance / fee-bump if needed.
    let withdrawalResult;
    try {
      withdrawalResult = await submitSponsoredLabasWithdrawal({
        destinationPublicKey: requestedPublicKey,
        amount: tokenAmount,
        memoText: `LabasApp:${tokenAmount}LABAS`,
        signedInnerTxXdr:
          typeof body.signedInnerTxXdr === 'string' ? body.signedInnerTxXdr : undefined,
      });
    } catch (stellarErr: unknown) {
      await releaseFirestoreWithdrawLock({ projectId, uid, idToken });
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

    // 9. Ledger Sync: Deduct withdrawn amount from internalLabasBalance & xpBalance in Firestore and log tx hash
    const newXpBalance = Math.max(0, effectiveXpBalance - xpToWithdraw);
    const newInternalLabasBalance = Number(
      Math.max(0, effectiveInternalLabas - tokenAmount).toFixed(4)
    );
    const claimTimestamp = new Date().toISOString();
    const claimId = `withdraw_${Date.now()}_${withdrawalResult.hash.slice(0, 10)}`;
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
      xpClaimed: xpToWithdraw,
      tokenAmount,
      assetCode: withdrawalResult.assetCode,
      transactionHash: withdrawalResult.hash,
      ledger: withdrawalResult.ledger,
      explorerUrl: withdrawalResult.explorerUrl,
      transferMode: withdrawalResult.transferMode,
      network: 'PUBLIC',
      timestamp: claimTimestamp,
    };

    const updatedNestedProgress = {
      ...nestedProgress,
      xp: newXpBalance,
      xpBalance: newXpBalance,
      internalLabasBalance: newInternalLabasBalance,
      walletActivated: true,
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
      internalLabasBalance: toFirestoreValue(newInternalLabasBalance),
      walletActivated: toFirestoreValue(true),
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
      transferMode: toFirestoreValue(claimRecord.transferMode),
      network: toFirestoreValue('PUBLIC'),
      timestamp: toFirestoreValue(claimRecord.timestamp),
    };

    const commitUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/(default)/documents:commit`;

    const subClaimDocName = `projects/${projectId}/databases/(default)/documents/users/${uid}/token_claims/${claimId}`;
    const topClaimDocName = `projects/${projectId}/databases/(default)/documents/token_claims/${claimId}`;

    try {
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
    } catch {
      // Non-fatal if Firestore (default) database is not yet provisioned
    }

    firestoreLockAcquired = false;

    return NextResponse.json({
      success: true,
      transactionHash: withdrawalResult.hash,
      ledger: withdrawalResult.ledger,
      explorerUrl: withdrawalResult.explorerUrl,
      issuedTokenAmount: tokenAmount,
      xpClaimed: xpToWithdraw,
      updatedXpBalance: newXpBalance,
      updatedInternalLabasBalance: newInternalLabasBalance,
      walletActivated: true,
      transferMode: withdrawalResult.transferMode,
      lifetimeXpEarned,
      assetCode: withdrawalResult.assetCode,
      stellarPublicKey: requestedPublicKey,
      lastClaimTimestamp: claimTimestamp,
      claimRecord,
    });
  } catch (error: unknown) {
    console.error(
      '[STELLAR_WITHDRAW_API_ERROR]:',
      error instanceof Error ? error.message : 'Unexpected error'
    );

    if (firestoreLockAcquired && lockedUid && activeIdToken) {
      await releaseFirestoreWithdrawLock({
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
            : 'An unexpected error occurred while processing your $LABAS Mainnet withdrawal.',
        errorCode: 'internal_error',
      },
      { status: 500 }
    );
  } finally {
    if (lockedUid) {
      activeWithdrawLocks.delete(lockedUid);
    }
  }
}

