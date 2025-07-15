export type QrCodeChallengeResponse = {
  challengeId: string;
  expiresAt: string;
  /**
   * Only available in polling mode
   */
  deviceCode?: string;
};

export type QrCodeVerifyResponse = {
  isClaimed: boolean;
  isVerified: boolean;
  isConsumed: boolean;
  token?: string;
};
