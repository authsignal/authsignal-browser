import {ChallengeParams} from "../qr-code";
import {AuthsignalResponse} from "../types";
import {QrCodeChallengeResponse} from "../api/types/qr-code";

export interface QrHandler {
  challenge(params: ChallengeParams): Promise<AuthsignalResponse<QrCodeChallengeResponse>>;
  refresh(params: {custom?: Record<string, unknown>}): Promise<void>;
  disconnect(): void;
}

export abstract class BaseQrHandler implements QrHandler {
  abstract challenge(params: ChallengeParams): Promise<AuthsignalResponse<QrCodeChallengeResponse>>;
  abstract refresh(params: {custom?: Record<string, unknown>}): Promise<void>;
  abstract disconnect(): void;
}
