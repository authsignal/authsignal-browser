export type PushChallengeResponse = {
  challengeId: string;
};

export type PushVerifyApiResponse = {
  isVerified: boolean;
  isConsumed: boolean;
  accessToken?: string;
};

export type PushVerifyResponse = {
  isVerified: boolean;
  isConsumed: boolean;
  token?: string;
};
