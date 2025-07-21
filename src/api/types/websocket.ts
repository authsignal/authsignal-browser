export type WebSocketMessageType = "CREATE_CHALLENGE" | "CHALLENGE_CREATED" | "STATE_CHANGE";

export type ChallengeState = "unclaimed" | "claimed" | "approved" | "rejected";

export interface CreateChallengeMessage {
  type: "CREATE_CHALLENGE";
  data: {
    challengeType: "QR_CODE";
    actionCode: string;
    custom?: Record<string, unknown>;
  };
}

export interface ChallengeCreatedMessage {
  type: "CHALLENGE_CREATED";
  data: {
    challengeId: string;
    challengeType: "QR_CODE";
    expiresAt: string;
    state: ChallengeState;
  };
}

export interface StateChangeMessage {
  type: "STATE_CHANGE";
  data: {
    challengeId: string;
    state: ChallengeState;
    accessToken?: string;
  };
}

export type WebSocketMessage = CreateChallengeMessage | ChallengeCreatedMessage | StateChangeMessage;

export interface WebSocketQrCodeOptions {
  token?: string;
  action: string;
  custom?: Record<string, unknown>;
  refreshInterval?: number;
  onRefresh?: (challengeId: string, expiresAt: string) => void;
  onStateChange?: (state: ChallengeState, accessToken?: string) => void;
}

export interface WebSocketQrCodeResponse {
  challengeId: string;
  expiresAt: string;
  state: ChallengeState;
}
