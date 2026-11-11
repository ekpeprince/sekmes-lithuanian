import { Asset, Horizon } from '@stellar/stellar-sdk';

export declare const DEFAULT_ISSUER_PUBLIC_KEY: string;

export declare const STELLAR_CONFIG: {
  readonly network: string;
  readonly serverUrl: string;
  readonly assetCode: string;
  readonly issuerPublicKey: string;
};

export declare function isValidStellarPublicKey(publicKey?: string | null): boolean;

export declare function validateIssuerConfig(): {
  valid: boolean;
  errorCode: string | null;
  message: string | null;
};

export declare function getHorizonServer(): Horizon.Server;
export declare function getNetworkPassphrase(): string;
export declare function getLabasAsset(): Asset;
export declare function formatStellarAmount(amount: number | string): string;

export interface TrustlineCheckResult {
  hasTrustline: boolean;
  accountExists: boolean;
  balance?: string;
  errorCode?: string | null;
  message?: string | null;
  assetCode: string;
  issuerPublicKey: string;
}

export declare function verifyLabasTrustline(
  recipientPublicKey: string
): Promise<TrustlineCheckResult>;

export declare function parseStellarError(error: unknown): {
  errorCode: string;
  userMessage: string;
  statusCode: number;
};

export interface LabasPaymentResult {
  hash: string;
  ledger: number;
  amount: string;
  assetCode: string;
  issuerPublicKey: string;
  destinationPublicKey: string;
  explorerUrl: string;
}

export interface SponsoredWithdrawalResult extends LabasPaymentResult {
  transferMode: 'direct_payment' | 'sponsored_claimable_balance';
  walletActivated: boolean;
}

export declare function submitLabasPayment(params: {
  destinationPublicKey: string;
  amount: number | string;
  memoText?: string;
}): Promise<LabasPaymentResult>;

export declare function submitSponsoredLabasWithdrawal(params: {
  destinationPublicKey: string;
  amount: number | string;
  memoText?: string;
  signedInnerTxXdr?: string;
}): Promise<SponsoredWithdrawalResult>;

export interface SponsoredTrustlineBuildResult {
  xdr: string;
  networkPassphrase: string;
  sponsorPublicKey: string;
  assetCode: string;
}

export interface SponsoredTrustlineSubmitResult {
  hash: string;
  ledger: number;
  explorerUrl: string;
}

export declare function buildSponsoredTrustlineTransaction(
  userPublicKey: string
): Promise<SponsoredTrustlineBuildResult>;

export declare function submitSponsoredTrustlineTransaction(
  signedXdr: string
): Promise<SponsoredTrustlineSubmitResult>;


