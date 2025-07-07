export type PushChallengeResponse = {
  challengeId: string;
};

export type PushVerifyResponse = {
  isVerified: boolean;
  isConsumed: boolean;
  accessToken?: string;
}; 