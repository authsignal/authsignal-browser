export type ApiClientOptions = {
  baseUrl: string;
  tenantId: string;
};

export type VerifyResponse = {
  isVerified: boolean;
  token?: string;
  failureReason?: string;
};

export type ErrorResponse = {
  error: string;
  errorDescription?: string;
};

export type AuthsignalResponse<T> = T | ErrorResponse;
