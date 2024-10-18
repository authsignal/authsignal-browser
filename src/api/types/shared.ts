export type ApiClientOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
};

export type VerifyResponse = {
  isVerified: boolean;
  accessToken?: string;
  failureReason?: string;
};

export type ErrorResponse = {
  error: string;
  // eslint-disable-next-line @typescript-eslint/ban-types -- This is a valid use case for an empty object
  errorCode?: "expired_token" | (string & {});
  errorDescription?: string;
};
