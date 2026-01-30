export type PresentationOptionsRequest = {
  action?: string;
  token?: string;
  anonymous?: boolean;
  challengeId?: string;
  documentTypes?: string[];
  claims?: string[][];
};

export type PresentationOptionsResponse = {
  challengeId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dcapiOptions: any;
};

export type VerifyPresentationRequest = {
  token?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  challengeId: string;
  redirectUrl?: string;
};

export type VerifyPresentationResponse = {
  isVerified: boolean;
  accessToken?: string;
  username?: string;
  userId?: string;
  url?: string;
  requireUserVerification?: boolean;
  claims?: Record<string, string>;
};
