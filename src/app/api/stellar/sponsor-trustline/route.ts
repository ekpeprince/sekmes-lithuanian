import { NextRequest, NextResponse } from 'next/server';
import {
  isValidStellarPublicKey,
  validateIssuerConfig,
  buildSponsoredTrustlineTransaction,
  submitSponsoredTrustlineTransaction,
  parseStellarError,
} from '@/lib/stellar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!idToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing Firebase ID token.' },
        { status: 401 }
      );
    }

    const verifiedUser = await verifyFirebaseIdToken(idToken);
    if (!verifiedUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired Firebase session.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'build';

    const issuerCheck = validateIssuerConfig();
    if (!issuerCheck.valid) {
      return NextResponse.json(
        {
          error: issuerCheck.message || 'Stellar Mainnet sponsor account is not configured.',
          errorCode: issuerCheck.errorCode,
        },
        { status: 503 }
      );
    }

    if (action === 'build') {
      const userPublicKey = (body.userPublicKey || '').trim();
      if (!isValidStellarPublicKey(userPublicKey)) {
        return NextResponse.json(
          {
            error: 'Invalid Stellar user public key. Must be a valid 56-character G... address.',
            errorCode: 'invalid_destination',
          },
          { status: 400 }
        );
      }

      const buildResult = await buildSponsoredTrustlineTransaction(userPublicKey);
      return NextResponse.json({
        success: true,
        xdr: buildResult.xdr,
        networkPassphrase: buildResult.networkPassphrase,
        sponsorPublicKey: buildResult.sponsorPublicKey,
        assetCode: buildResult.assetCode,
      });
    }

    if (action === 'submit') {
      const signedXdr = (body.signedXdr || '').trim();
      if (!signedXdr) {
        return NextResponse.json(
          {
            error: 'Missing signed transaction XDR string.',
            errorCode: 'invalid_xdr',
          },
          { status: 400 }
        );
      }

      const submitResult = await submitSponsoredTrustlineTransaction(signedXdr);
      return NextResponse.json({
        success: true,
        hash: submitResult.hash,
        ledger: submitResult.ledger,
        explorerUrl: submitResult.explorerUrl,
      });
    }

    return NextResponse.json(
      { error: `Unknown action: "${action}". Supported actions are "build" and "submit".` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const parsed = parseStellarError(err);
    return NextResponse.json(
      {
        error: parsed.userMessage,
        errorCode: parsed.errorCode,
      },
      { status: parsed.statusCode }
    );
  }
}

