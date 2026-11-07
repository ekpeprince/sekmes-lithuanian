import { Asset, Horizon } from '@stellar/stellar-sdk';

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

export declare function submitLabasPayment(params: {
  destinationPublicKey: string;
  amount: number | string;
  memoText?: string;
}): Promise<LabasPaymentResult>;

