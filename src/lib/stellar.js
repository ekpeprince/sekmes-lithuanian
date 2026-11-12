import {
  Asset,
  BASE_FEE,
  Claimant,
  Horizon,
  Keypair,
  Memo,
  Networks,
  NotFoundError,
  Operation,
  StrKey,
  TransactionBuilder,
  TransactionFailedError,
} from '@stellar/stellar-sdk';

export const DEFAULT_ISSUER_PUBLIC_KEY =
  'GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND';

export const STELLAR_CONFIG = {
  get network() {
    return (process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'PUBLIC').toUpperCase();
  },
  get serverUrl() {
    const raw = (process.env.STELLAR_SERVER_URL || 'https://horizon.stellar.org').trim();
    // Clean markdown link syntax if accidentally pasted in env
    const match = raw.match(/\((https?:\/\/[^)]+)\)/);
    return match ? match[1] : raw.replace(/^\[|\]$/g, '');
  },
  get assetCode() {
    return (process.env.ASSET_CODE || 'LABASCOIN').trim();
  },
  get issuerPublicKey() {
    const envKey = (process.env.ISSUER_PUBLIC_KEY || '').trim();
    if (envKey && !envKey.startsWith('<')) {
      return envKey;
    }
    return DEFAULT_ISSUER_PUBLIC_KEY;
  },
};

/**
 * Validates whether a string is a valid Stellar Ed25519 Public Key (starts with G, 56 chars).
 * @param {string | null | undefined} publicKey
 * @returns {boolean}
 */
export function isValidStellarPublicKey(publicKey) {
  if (!publicKey || typeof publicKey !== 'string') return false;
  const trimmed = publicKey.trim();
  if (trimmed.startsWith('<') || trimmed.length !== 56) return false;
  try {
    return StrKey.isValidEd25519PublicKey(trimmed);
  } catch {
    return false;
  }
}

/**
 * Validates whether the server-side Stellar Mainnet Issuer configuration is ready.
 * Never logs or exposes the secret key.
 */
export function validateIssuerConfig() {
  if (typeof window !== 'undefined') {
    throw new Error('Stellar issuer validation must only execute on the server.');
  }

  const issuerPublicKey = STELLAR_CONFIG.issuerPublicKey;
  const issuerSecretKey = (process.env.ISSUER_SECRET_KEY || '').trim();

  if (!issuerPublicKey || issuerPublicKey.startsWith('<')) {
    return {
      valid: false,
      errorCode: 'issuer_not_configured',
      message:
        'Stellar Mainnet ISSUER_PUBLIC_KEY is not configured on the server. Please set a valid G... public key in your production environment variables.',
    };
  }

  if (!isValidStellarPublicKey(issuerPublicKey)) {
    return {
      valid: false,
      errorCode: 'invalid_issuer_public_key',
      message: 'Configured ISSUER_PUBLIC_KEY is not a valid Stellar Ed25519 public key.',
    };
  }

  if (!issuerSecretKey || issuerSecretKey.startsWith('<')) {
    return {
      valid: false,
      errorCode: 'issuer_secret_not_configured',
      message:
        'Stellar Mainnet ISSUER_SECRET_KEY is not configured on the server. Please set a valid S... secret key in your production environment variables.',
    };
  }

  try {
    if (!StrKey.isValidEd25519SecretSeed(issuerSecretKey)) {
      return {
        valid: false,
        errorCode: 'invalid_issuer_secret_key',
        message: 'Configured ISSUER_SECRET_KEY is not a valid Stellar Ed25519 secret seed.',
      };
    }
  } catch {
    return {
      valid: false,
      errorCode: 'invalid_issuer_secret_key',
      message: 'Configured ISSUER_SECRET_KEY is not a valid Stellar Ed25519 secret seed.',
    };
  }

  return {
    valid: true,
    errorCode: null,
    message: null,
  };
}

/**
 * Returns the Horizon Server instance connected to Stellar Mainnet.
 * @returns {Horizon.Server}
 */
export function getHorizonServer() {
  return new Horizon.Server(STELLAR_CONFIG.serverUrl, {
    allowHttp: false,
  });
}

/**
 * Returns the Stellar Network passphrase (strictly PUBLIC mainnet by default).
 * @returns {string}
 */
export function getNetworkPassphrase() {
  return STELLAR_CONFIG.network === 'TESTNET' ? Networks.TESTNET : Networks.PUBLIC;
}

/**
 * Initializes the $LABAS asset tied to ISSUER_PUBLIC_KEY.
 * @returns {Asset}
 */
export function getLabasAsset() {
  const issuerPublicKey = STELLAR_CONFIG.issuerPublicKey;
  const assetCode = STELLAR_CONFIG.assetCode;

  if (!isValidStellarPublicKey(issuerPublicKey)) {
    throw new Error(
      `Cannot initialize $${assetCode} asset: ISSUER_PUBLIC_KEY is missing or invalid.`
    );
  }

  return new Asset(assetCode, issuerPublicKey);
}

/**
 * Formats a numeric token amount to a valid Stellar 7-decimal string.
 * @param {number | string} amount
 * @returns {string}
 */
export function formatStellarAmount(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error('Token transfer amount must be a positive number.');
  }
  return num.toFixed(7);
}

/**
 * Checks if a recipient user's mainnet public key has an active trustline for the $LABAS asset
 * before executing transfers.
 *
 * @param {string} recipientPublicKey
 * @returns {Promise<{
 *   hasTrustline: boolean;
 *   accountExists: boolean;
 *   balance?: string;
 *   errorCode?: string | null;
 *   message?: string | null;
 *   assetCode: string;
 *   issuerPublicKey: string;
 * }>}
 */
export async function verifyLabasTrustline(recipientPublicKey) {
  const assetCode = STELLAR_CONFIG.assetCode;
  const issuerPublicKey = STELLAR_CONFIG.issuerPublicKey;

  if (!isValidStellarPublicKey(recipientPublicKey)) {
    return {
      hasTrustline: false,
      accountExists: false,
      errorCode: 'invalid_destination',
      message:
        'Invalid Stellar Mainnet wallet address. Please enter a valid 56-character Stellar public key starting with "G".',
      assetCode,
      issuerPublicKey,
    };
  }

  if (!isValidStellarPublicKey(issuerPublicKey)) {
    return {
      hasTrustline: false,
      accountExists: false,
      errorCode: 'issuer_not_configured',
      message:
        'Stellar Mainnet ISSUER_PUBLIC_KEY is not configured yet. Please configure ISSUER_PUBLIC_KEY in the server environment.',
      assetCode,
      issuerPublicKey,
    };
  }

  const cleanRecipient = recipientPublicKey.trim();

  // If the recipient is the issuer account itself, it implicitly trusts its own asset
  if (cleanRecipient === issuerPublicKey) {
    return {
      hasTrustline: true,
      accountExists: true,
      balance: '0.0000000',
      errorCode: null,
      message: null,
      assetCode,
      issuerPublicKey,
    };
  }

  const server = getHorizonServer();

  try {
    const account = await server.loadAccount(cleanRecipient);

    const trustline = account.balances.find((bal) => {
      if (bal.asset_type === 'native' || bal.asset_type === 'liquidity_pool_shares') {
        return false;
      }
      return bal.asset_code === assetCode && bal.asset_issuer === issuerPublicKey;
    });

    if (!trustline) {
      return {
        hasTrustline: false,
        accountExists: true,
        errorCode: 'op_no_trust',
        message: `Your Stellar wallet does not have an active trustline for $${assetCode}. Please open your Stellar wallet (e.g., Lobstr, Freighter, or xBull) and add a trustline for Asset Code "${assetCode}" with Issuer "${issuerPublicKey}" before claiming.`,
        assetCode,
        issuerPublicKey,
      };
    }

    if (
      'is_authorized' in trustline &&
      trustline.is_authorized === false
    ) {
      return {
        hasTrustline: false,
        accountExists: true,
        errorCode: 'op_not_authorized',
        message: `Your wallet's trustline for $${assetCode} is not authorized yet. Please verify your trustline status in your Stellar wallet.`,
        assetCode,
        issuerPublicKey,
      };
    }

    if ('limit' in trustline && Number(trustline.limit) <= 0) {
      return {
        hasTrustline: false,
        accountExists: true,
        errorCode: 'op_line_full',
        message: `Your wallet's trustline limit for $${assetCode} is set to 0. Please increase the trustline limit in your Stellar wallet.`,
        assetCode,
        issuerPublicKey,
      };
    }

    return {
      hasTrustline: true,
      accountExists: true,
      balance: 'balance' in trustline ? trustline.balance : '0.0000000',
      errorCode: null,
      message: null,
      assetCode,
      issuerPublicKey,
    };
  } catch (error) {
    if (error instanceof NotFoundError || (error && error.response && error.response.status === 404)) {
      return {
        hasTrustline: false,
        accountExists: false,
        errorCode: 'account_not_found',
        message: `Your Stellar Mainnet wallet (${cleanRecipient.slice(0, 6)}...${cleanRecipient.slice(-4)}) is not activated on the Stellar Public Network yet. Please fund your wallet with at least 1.5 XLM and add the $${assetCode} trustline first.`,
        assetCode,
        issuerPublicKey,
      };
    }

    const parsed = parseStellarError(error);
    return {
      hasTrustline: false,
      accountExists: false,
      errorCode: parsed.errorCode,
      message: parsed.userMessage,
      assetCode,
      issuerPublicKey,
    };
  }
}

/**
 * Translates Stellar Horizon / Ledger exceptions into clear, actionable mainnet error messages.
 * Never leaks secrets or internal stack traces.
 *
 * @param {unknown} error
 * @returns {{ errorCode: string; userMessage: string; statusCode: number }}
 */
export function parseStellarError(error) {
  const assetCode = STELLAR_CONFIG.assetCode;
  const issuerPublicKey = STELLAR_CONFIG.issuerPublicKey;

  if (error instanceof TransactionFailedError) {
    const codes = error.getResultCodes();
    const txCode = codes.transaction;
    const opCodes = Array.isArray(codes.operations) ? codes.operations : [];

    if (opCodes.includes('op_no_trust')) {
      return {
        errorCode: 'op_no_trust',
        userMessage: `Missing $${assetCode} trustline (op_no_trust). Please add a trustline for Asset "${assetCode}" (Issuer: ${issuerPublicKey}) in your Stellar wallet before claiming rewards.`,
        statusCode: 400,
      };
    }

    if (opCodes.includes('op_underfunded')) {
      return {
        errorCode: 'op_underfunded',
        userMessage:
          'Reward treasury account is temporarily underfunded or replenishing XLM reserves (op_underfunded). Your XP has not been deducted. Please try again shortly.',
        statusCode: 503,
      };
    }

    if (opCodes.includes('op_line_full')) {
      return {
        errorCode: 'op_line_full',
        userMessage: `Your Stellar wallet has reached its maximum trustline limit for $${assetCode} (op_line_full). Please increase your trustline limit in your wallet.`,
        statusCode: 400,
      };
    }

    if (opCodes.includes('op_not_authorized')) {
      return {
        errorCode: 'op_not_authorized',
        userMessage: `Your wallet's $${assetCode} trustline is not authorized (op_not_authorized).`,
        statusCode: 400,
      };
    }

    if (opCodes.includes('op_no_destination')) {
      return {
        errorCode: 'op_no_destination',
        userMessage:
          'Destination Stellar account does not exist on the Stellar Mainnet (op_no_destination). Please activate your wallet with XLM first.',
        statusCode: 400,
      };
    }

    if (txCode === 'tx_bad_seq') {
      return {
        errorCode: 'tx_bad_seq',
        userMessage:
          'High network concurrency caused a sequence mismatch on the Stellar Mainnet (tx_bad_seq). Your XP was preserved — please click Convert again in a few seconds.',
        statusCode: 409,
      };
    }

    if (txCode === 'tx_insufficient_fee' || txCode === 'tx_too_late') {
      return {
        errorCode: txCode,
        userMessage: `Stellar Mainnet is experiencing high ledger traffic (${txCode}). Your XP was not deducted — please retry your claim in a moment.`,
        statusCode: 503,
      };
    }

    if (txCode === 'tx_bad_auth') {
      return {
        errorCode: 'tx_bad_auth',
        userMessage:
          'Reward issuer signature verification failed (tx_bad_auth). Please verify server issuer key configuration.',
        statusCode: 500,
      };
    }

    const combinedCode = opCodes.length > 0 ? opCodes.join(', ') : txCode || 'tx_failed';
    return {
      errorCode: combinedCode,
      userMessage: `Stellar Mainnet transaction was rejected by the ledger (${combinedCode}). Your XP balance was not deducted.`,
      statusCode: 400,
    };
  }

  // Fallback inspection for raw Horizon error objects if not instantiated as TransactionFailedError
  const responseData = error && typeof error === 'object' && 'response' in error
    ? error.response?.data
    : null;
  const resultCodes = responseData?.extras?.result_codes;

  if (resultCodes) {
    const opCodes = Array.isArray(resultCodes.operations) ? resultCodes.operations : [];
    const txCode = resultCodes.transaction;

    if (opCodes.includes('op_no_trust')) {
      return {
        errorCode: 'op_no_trust',
        userMessage: `Missing $${assetCode} trustline (op_no_trust). Please establish a trustline for $${assetCode} in your Stellar wallet before claiming.`,
        statusCode: 400,
      };
    }
    if (opCodes.includes('op_underfunded')) {
      return {
        errorCode: 'op_underfunded',
        userMessage:
          'Reward treasury account has insufficient reserve balance (op_underfunded). Your XP was not deducted.',
        statusCode: 503,
      };
    }
    if (txCode === 'tx_bad_seq') {
      return {
        errorCode: 'tx_bad_seq',
        userMessage:
          'Transaction sequence conflict on Stellar Mainnet (tx_bad_seq). Your XP was not deducted — please retry in a few seconds.',
        statusCode: 409,
      };
    }
  }

  if (error instanceof NotFoundError || responseData?.status === 404) {
    return {
      errorCode: 'account_not_found',
      userMessage:
        'Account not found on Stellar Mainnet. Ensure both the issuer and destination accounts are funded with XLM on the Public Network.',
      statusCode: 400,
    };
  }

  const safeMsg =
    error instanceof Error ? error.message : 'Unable to reach Stellar Mainnet Horizon server.';
  return {
    errorCode: 'stellar_network_error',
    userMessage: `Stellar Mainnet communication error: ${safeMsg}`,
    statusCode: 502,
  };
}

/**
 * Builds, signs, and submits a Stellar Mainnet payment transaction transferring $LABAS tokens
 * from the issuer account to a verified user address.
 *
 * Strictly executes on the server. ISSUER_SECRET_KEY is never exposed or logged.
 *
 * @param {{
 *   destinationPublicKey: string;
 *   amount: number | string;
 *   memoText?: string;
 * }} params
 * @returns {Promise<{
 *   hash: string;
 *   ledger: number;
 *   amount: string;
 *   assetCode: string;
 *   issuerPublicKey: string;
 *   destinationPublicKey: string;
 *   explorerUrl: string;
 * }>}
 */
export async function submitLabasPayment({ destinationPublicKey, amount, memoText }) {
  if (typeof window !== 'undefined') {
    throw new Error('submitLabasPayment must only be executed in a server-side environment.');
  }

  const configCheck = validateIssuerConfig();
  if (!configCheck.valid) {
    const err = new Error(configCheck.message || 'Invalid Stellar issuer configuration');
    err.code = configCheck.errorCode;
    throw err;
  }

  const cleanDestination = (destinationPublicKey || '').trim();
  if (!isValidStellarPublicKey(cleanDestination)) {
    const err = new Error(
      'Invalid destination Stellar public key. Must be a valid 56-character G... address.'
    );
    err.code = 'invalid_destination';
    throw err;
  }

  // Verify trustline on Stellar Mainnet before building transaction
  const trustCheck = await verifyLabasTrustline(cleanDestination);
  if (!trustCheck.hasTrustline) {
    const err = new Error(
      trustCheck.message || `Destination wallet is missing the $${STELLAR_CONFIG.assetCode} trustline.`
    );
    err.code = trustCheck.errorCode || 'op_no_trust';
    throw err;
  }

  const issuerSecret = (process.env.ISSUER_SECRET_KEY || '').trim();
  const issuerKeypair = Keypair.fromSecret(issuerSecret);
  const signingPublicKey = issuerKeypair.publicKey();

  const server = getHorizonServer();
  const labasAsset = getLabasAsset();
  const formattedAmount = formatStellarAmount(amount);
  const networkPassphrase = getNetworkPassphrase();

  // Load source account sequence number from Stellar Mainnet
  const sourceAccount = await server.loadAccount(signingPublicKey);

  // Build transaction with 28-byte safe memo
  const safeMemo = String(memoText || 'LabasApp XP Reward')
    .replace(/[^\x20-\x7E]/g, '')
    .slice(0, 28);

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: String( Number(BASE_FEE) * 2 ), // 200 stroops for reliable mainnet inclusion
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: cleanDestination,
        asset: labasAsset,
        amount: formattedAmount,
      })
    )
    .addMemo(Memo.text(safeMemo))
    .setTimeout(30)
    .build();

  // Sign strictly on the server
  transaction.sign(issuerKeypair);

  // Submit to Stellar Mainnet Horizon
  const result = await server.submitTransaction(transaction);

  return {
    hash: result.hash,
    ledger: result.ledger,
    amount: formattedAmount,
    assetCode: STELLAR_CONFIG.assetCode,
    issuerPublicKey: STELLAR_CONFIG.issuerPublicKey,
    destinationPublicKey: cleanDestination,
    explorerUrl: `https://stellar.expert/explorer/public/tx/${result.hash}`,
  };
}

/**
 * Hybrid Gasless & Sponsored Withdrawal Execution:
 * Uses the Issuer Keypair (GBF7L...) to transfer $LABAS to the user's public G-address.
 * - If the user's account is already funded and has an active $LABAS trustline, submits a direct Operation.payment.
 * - If the user's account requires a trustline or initial funding on Stellar Mainnet, builds a backend-sponsored
 *   transaction (Operation.createClaimableBalance / Sponsored Reserves) so the user receives $LABAS on-chain
 *   with zero onboarding friction.
 */
export async function submitSponsoredLabasWithdrawal({
  destinationPublicKey,
  amount,
  memoText,
  signedInnerTxXdr,
}) {
  if (typeof window !== 'undefined') {
    throw new Error(
      'submitSponsoredLabasWithdrawal must only be executed in a server-side environment.'
    );
  }

  const configCheck = validateIssuerConfig();
  if (!configCheck.valid) {
    const err = new Error(configCheck.message || 'Invalid Stellar issuer configuration');
    err.code = configCheck.errorCode;
    throw err;
  }

  const cleanDestination = (destinationPublicKey || '').trim();
  if (!isValidStellarPublicKey(cleanDestination)) {
    const err = new Error(
      'Invalid destination Stellar public key. Must be a valid 56-character G... address.'
    );
    err.code = 'invalid_destination';
    throw err;
  }

  const issuerSecret = (process.env.ISSUER_SECRET_KEY || '').trim();
  const issuerKeypair = Keypair.fromSecret(issuerSecret);
  const signingPublicKey = issuerKeypair.publicKey();

  const server = getHorizonServer();
  const labasAsset = getLabasAsset();
  const formattedAmount = formatStellarAmount(amount);
  const networkPassphrase = getNetworkPassphrase();

  // If the client provided a user-signed inner transaction XDR, wrap it in a native Stellar Fee-Bump transaction
  // sponsored by the Issuer Keypair (GBF7L...)
  if (signedInnerTxXdr && typeof signedInnerTxXdr === 'string') {
    const innerTx = TransactionBuilder.fromXDR(signedInnerTxXdr, networkPassphrase);
    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      issuerKeypair,
      String(Number(BASE_FEE) * 3),
      innerTx,
      networkPassphrase
    );
    feeBumpTx.sign(issuerKeypair);
    const feeBumpResult = await server.submitTransaction(feeBumpTx);

    return {
      hash: feeBumpResult.hash,
      ledger: feeBumpResult.ledger,
      amount: formattedAmount,
      assetCode: STELLAR_CONFIG.assetCode,
      issuerPublicKey: signingPublicKey,
      destinationPublicKey: cleanDestination,
      transferMode: 'direct_payment',
      walletActivated: true,
      explorerUrl: `https://stellar.expert/explorer/public/tx/${feeBumpResult.hash}`,
    };
  }

  // Check whether the user's G-address already has an active trustline on Stellar Mainnet
  const trustCheck = await verifyLabasTrustline(cleanDestination);
  const sourceAccount = await server.loadAccount(signingPublicKey);

  const safeMemo = String(memoText || 'LabasApp $LABAS Withdraw')
    .replace(/[^\x20-\x7E]/g, '')
    .slice(0, 28);

  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: String(Number(BASE_FEE) * 2),
    networkPassphrase,
  });

  let transferMode = 'direct_payment';

  // LOBSTR mobile app enforces a strict 5.0 XLM balance requirement before allowing users to claim
  let currentXlm = 0;
  try {
    const acc = await server.loadAccount(cleanDestination);
    const nativeBal = acc.balances.find((b) => b.asset_type === 'native');
    if (nativeBal) currentXlm = Number(nativeBal.balance);
  } catch {
    currentXlm = 0;
  }

  if (trustCheck.accountExists && trustCheck.hasTrustline) {
    // Direct Mainnet payment when account is active and trusts $LABAS
    txBuilder.addOperation(
      Operation.payment({
        destination: cleanDestination,
        asset: labasAsset,
        amount: formattedAmount,
      })
    );
  } else {
    // Zero-Stress Learner Onboarding:
    // If the learner's destination wallet does not exist on Stellar yet (e.g. brand new LOBSTR wallet),
    // automatically activate it by funding 5.0000000 XLM from the Treasury account so LOBSTR's
    // 5 XLM minimum balance check is 100% satisfied.
    if (!trustCheck.accountExists) {
      txBuilder.addOperation(
        Operation.createAccount({
          destination: cleanDestination,
          startingBalance: '5.0000000',
        })
      );
    } else if (currentXlm < 5.0) {
      // If account exists but has less than 5 XLM (e.g. partial balance), top up the difference
      const diff = Number((5.0001 - currentXlm).toFixed(7));
      if (diff > 0.0001) {
        txBuilder.addOperation(
          Operation.payment({
            destination: cleanDestination,
            asset: Asset.native(),
            amount: diff.toFixed(7),
          })
        );
      }
    }

    // Gasless Issuer-Sponsored On-Chain Transfer (Operation.createClaimableBalance)
    // Allows the user's G-address to receive $LABAS on Stellar Mainnet even before establishing a trustline
    // or funding base XLM reserves, with reserves sponsored by the Issuer account.
    transferMode = 'sponsored_claimable_balance';
    txBuilder.addOperation(
      Operation.createClaimableBalance({
        asset: labasAsset,
        amount: formattedAmount,
        claimants: [
          new Claimant(cleanDestination, Claimant.predicateUnconditional()),
        ],
      })
    );
  }

  const transaction = txBuilder
    .addMemo(Memo.text(safeMemo))
    .setTimeout(30)
    .build();

  transaction.sign(issuerKeypair);

  const result = await server.submitTransaction(transaction);

  return {
    hash: result.hash,
    ledger: result.ledger,
    amount: formattedAmount,
    assetCode: STELLAR_CONFIG.assetCode,
    issuerPublicKey: signingPublicKey,
    destinationPublicKey: cleanDestination,
    transferMode,
    walletActivated: true,
    explorerUrl: `https://stellar.expert/explorer/public/tx/${result.hash}`,
  };
}

/**
 * Zero-Stress User Onboarding: Sponsored Trustline Sandwich Transaction
 * Builds a Stellar transaction where the Treasury/Issuer sponsors both the XLM base fee
 * and the 0.5 XLM trustline reserve for the user's G-address.
 *
 * Sandwich structure:
 * 1. Operation.beginSponsoringFutureReserves({ sponsoredId: userPublicKey })
 * 2. Operation.changeTrust({ asset: labasAsset, source: userPublicKey })
 * 3. Operation.endSponsoringFutureReserves({ source: userPublicKey })
 *
 * Pre-signed by the Sponsor/Treasury account, returned as XDR for client signature.
 *
 * @param {string} userPublicKey
 * @returns {Promise<{ xdr: string; networkPassphrase: string; sponsorPublicKey: string; assetCode: string }>}
 */
export async function buildSponsoredTrustlineTransaction(userPublicKey) {
  if (typeof window !== 'undefined') {
    throw new Error('buildSponsoredTrustlineTransaction must only execute on the server.');
  }

  const cleanUserKey = (userPublicKey || '').trim();
  if (!isValidStellarPublicKey(cleanUserKey)) {
    const err = new Error('Invalid Stellar user public key. Must be a valid 56-character G... address.');
    err.code = 'invalid_destination';
    throw err;
  }

  const configCheck = validateIssuerConfig();
  if (!configCheck.valid) {
    const err = new Error(configCheck.message || 'Invalid Stellar issuer configuration.');
    err.code = configCheck.errorCode;
    throw err;
  }

  const server = getHorizonServer();
  const issuerSecret = (process.env.ISSUER_SECRET_KEY || '').trim();
  const sponsorKeypair = Keypair.fromSecret(issuerSecret);
  const sponsorPublicKey = sponsorKeypair.publicKey();
  const networkPassphrase = getNetworkPassphrase();
  const labasAsset = getLabasAsset();

  // Load the sponsor account to pay transaction fees (Zero fee for student)
  const sponsorAccount = await server.loadAccount(sponsorPublicKey);

  const transaction = new TransactionBuilder(sponsorAccount, {
    fee: String(Number(BASE_FEE) * 2), // 200 stroops paid entirely by Treasury
    networkPassphrase,
  })
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: cleanUserKey,
      })
    )
    .addOperation(
      Operation.changeTrust({
        asset: labasAsset,
        source: cleanUserKey,
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: cleanUserKey,
      })
    )
    .addMemo(Memo.text('LabasApp Trustline Sponsor'))
    .setTimeout(180) // 3 minute window for user wallet prompt
    .build();

  // Sign by sponsor/treasury
  transaction.sign(sponsorKeypair);

  return {
    xdr: transaction.toXDR(),
    networkPassphrase,
    sponsorPublicKey,
    assetCode: STELLAR_CONFIG.assetCode,
  };
}

/**
 * Submits a dual-signed (Sponsor + User) sponsored trustline transaction to Horizon.
 *
 * @param {string} signedXdr
 * @returns {Promise<{ hash: string; ledger: number; explorerUrl: string }>}
 */
export async function submitSponsoredTrustlineTransaction(signedXdr) {
  if (typeof window !== 'undefined') {
    throw new Error('submitSponsoredTrustlineTransaction must only execute on the server.');
  }

  if (!signedXdr || typeof signedXdr !== 'string') {
    const err = new Error('Missing or invalid signed transaction XDR string.');
    err.code = 'invalid_xdr';
    throw err;
  }

  const server = getHorizonServer();
  const networkPassphrase = getNetworkPassphrase();

  let transaction;
  try {
    transaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  } catch (parseErr) {
    const err = new Error('Failed to parse Stellar transaction XDR: ' + (parseErr?.message || 'Invalid format'));
    err.code = 'invalid_xdr';
    throw err;
  }

  const result = await server.submitTransaction(transaction);

  return {
    hash: result.hash,
    ledger: result.ledger,
    explorerUrl: `https://stellar.expert/explorer/public/tx/${result.hash}`,
  };
}

/**
 * Ensures a learner's Stellar account meets LOBSTR's proprietary 5.0 XLM minimum balance
 * requirement so they can claim tokens or add trustlines without being blocked.
 * If the account does not exist, creates it with 5.0000000 XLM.
 * If the account exists with less than 5.0 XLM, tops up the difference from Treasury.
 *
 * @param {string} userPublicKey
 * @returns {Promise<{ success: boolean; funded: boolean; hash?: string; ledger?: number; explorerUrl?: string; newBalance: number; message?: string }>}
 */
export async function ensureLobstrMinimumBalance(userPublicKey) {
  if (typeof window !== 'undefined') {
    throw new Error('ensureLobstrMinimumBalance must only execute on the server.');
  }

  const cleanUserKey = (userPublicKey || '').trim();
  if (!isValidStellarPublicKey(cleanUserKey)) {
    const err = new Error('Invalid Stellar user public key.');
    err.code = 'invalid_destination';
    throw err;
  }

  const configCheck = validateIssuerConfig();
  if (!configCheck.valid) {
    const err = new Error(configCheck.message || 'Invalid Stellar issuer configuration.');
    err.code = configCheck.errorCode;
    throw err;
  }

  const server = getHorizonServer();
  const issuerSecret = (process.env.ISSUER_SECRET_KEY || '').trim();
  const issuerKeypair = Keypair.fromSecret(issuerSecret);
  const signingPublicKey = issuerKeypair.publicKey();
  const networkPassphrase = getNetworkPassphrase();

  let accountExists = false;
  let currentXlm = 0;

  try {
    const acc = await server.loadAccount(cleanUserKey);
    accountExists = true;
    const nativeBal = acc.balances.find((b) => b.asset_type === 'native');
    if (nativeBal) {
      currentXlm = Number(nativeBal.balance);
    }
  } catch {
    accountExists = false;
    currentXlm = 0;
  }

  if (currentXlm >= 5.0) {
    return {
      success: true,
      funded: false,
      newBalance: currentXlm,
      message: 'Account already meets the 5.0 XLM LOBSTR threshold.',
    };
  }

  const sourceAccount = await server.loadAccount(signingPublicKey);
  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: String(Number(BASE_FEE) * 2),
    networkPassphrase,
  });

  if (!accountExists) {
    txBuilder.addOperation(
      Operation.createAccount({
        destination: cleanUserKey,
        startingBalance: '5.0000000',
      })
    );
  } else {
    const diff = Number((5.0001 - currentXlm).toFixed(7));
    if (diff > 0.0001) {
      txBuilder.addOperation(
        Operation.payment({
          destination: cleanUserKey,
          asset: Asset.native(),
          amount: diff.toFixed(7),
        })
      );
    }
  }

  const tx = txBuilder.addMemo(Memo.text('LabasApp LOBSTR Activation')).setTimeout(30).build();
  tx.sign(issuerKeypair);

  const result = await server.submitTransaction(tx);

  return {
    success: true,
    funded: true,
    hash: result.hash,
    ledger: result.ledger,
    explorerUrl: `https://stellar.expert/explorer/public/tx/${result.hash}`,
    newBalance: 5.0001,
  };
}


