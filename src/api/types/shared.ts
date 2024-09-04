export type ApiClientOptions = {
  baseUrl: string;
  tenantId: string;
};

export type EnrollResponse = {
  userAuthenticatorId: string;
};

export type ChallengeResponse = {
  challengeId: string;
};

export type VerifyResponse = {
  isVerified: boolean;
  accessToken?: string;
  failureReason?: string;
};

export type ErrorResponse = {
  error: string;
  errorDescription?: string;
};

export type AuthsignalResponse<T> = T | ErrorResponse;
