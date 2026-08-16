export type PushDeliveryResult = {
  userAuthenticatorId: string;
  errorCode?: string;
};

export type PushChallengeResponse = {
  challengeId: string;
  deliveryResults?: PushDeliveryResult[];
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
