import {QrCodeChallengeResponse} from "./api/types/qr-code";
import {ChallengeState} from "./api/types/websocket";
import {AuthsignalResponse} from "./types";
import {QrHandler} from "./qr-code/base-qr-handler";
import {RestQrHandler} from "./qr-code/rest-qr-handler";
import {WebSocketQrHandler} from "./qr-code/websocket-qr-handler";

type QrCodeOptions = {
  baseUrl: string;
  tenantId: string;
  enableLogging: boolean;
};

export type ChallengeParams = {
  /** The action to be performed when the QR code is scanned. If track action is called, this must match the action passed to track. */
  action: string;
  /** Custom data to be included in the challenge request. If track action is called, this must be omitted. */
  custom?: Record<string, unknown>;
  /** Use REST API polling instead of WebSocket connection. Default: false */
  polling?: boolean;
  /** The interval in milliseconds at which the QR code challenge will be polled. Default: 5 seconds (Only used when polling is true)*/
  pollInterval?: number;
  /** The interval in milliseconds at which the QR code challenge will be refreshed. Default: 9 minutes */
  refreshInterval?: number;
  /** A callback function that is called when the QR code challenge is refreshed. */
  onRefresh?: (challengeId: string, expiresAt: string) => void;
  /** A callback function that is called when the state of the QR code challenge changes. */
  onStateChange: (state: ChallengeState, accessToken?: string) => void;
};

export class QrCode {
  private handler: QrHandler | null = null;
  private baseUrl: string;
  private tenantId: string;
  private enableLogging = false;

  constructor({baseUrl, tenantId, enableLogging}: QrCodeOptions) {
    this.baseUrl = baseUrl;
    this.tenantId = tenantId;
    this.enableLogging = enableLogging;
  }

  async challenge(params: ChallengeParams): Promise<AuthsignalResponse<QrCodeChallengeResponse>> {
    const {polling = false, ...challengeParams} = params;

    if (this.handler) {
      this.handler.disconnect();
    }

    if (polling) {
      this.handler = new RestQrHandler({
        baseUrl: this.baseUrl,
        tenantId: this.tenantId,
        enableLogging: this.enableLogging,
      });
    } else {
      this.handler = new WebSocketQrHandler({
        baseUrl: this.baseUrl,
        tenantId: this.tenantId,
        enableLogging: this.enableLogging,
      });
    }

    return this.handler.challenge(challengeParams);
  }

  async refresh({custom}: {custom?: Record<string, unknown>} = {}): Promise<void> {
    if (!this.handler) {
      throw new Error("challenge() must be called before refresh()");
    }

    return this.handler.refresh({custom});
  }

  disconnect(): void {
    if (this.handler) {
      this.handler.disconnect();
      this.handler = null;
    }
  }
}
