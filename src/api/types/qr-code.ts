export type QrCodeChallengeResponse = {
  challengeId: string;
  deviceCode: string;
};

export type QrCodeVerifyResponse = {
  isClaimed: boolean;
  isVerified: boolean;
  isConsumed: boolean;
  token?: string;
};
