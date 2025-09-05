export type PresentationOptionsRequest = {
  token?: string;
  challengeId?: string;
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
  nonce: string;
  challengeId: string;
};

export type VerifyPresentationResponse = {
  isVerified: boolean;
  accessToken?: string;
  username?: string;
  userId?: string;
};
