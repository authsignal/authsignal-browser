import {QrCodeChallengeResponse} from "./api/types/qr-code";
import {ChallengeState} from "./api/types/websocket";
import {AuthsignalResponse} from "./types";
import {QrHandler} from "./qr-code/base-qr-handler";
import {RestQrHandler} from "./qr-code/rest-qr-handler";
import {WebSocketQrHandler} from "./qr-code/websocket-qr-handler";

type Mode = "websocket" | "rest";

type QrCodeOptions = {
  baseUrl: string;
  tenantId: string;
  mode: Mode;
};

export type ChallengeParams = {
  action: string;
  custom?: Record<string, unknown>;
  /** The interval in milliseconds at which the QR code challenge will be polled. Default: 5 seconds (Only used in REST API mode)*/
  pollInterval?: number;
  /** The interval in milliseconds at which the QR code challenge will be refreshed. Default: 9 minutes */
  refreshInterval?: number;
  /** A callback function that is called when the QR code challenge is refreshed. */
  onRefresh?: (challengeId: string, expiresAt: string) => void;
  /** A callback function that is called when the state of the QR code challenge changes. */
  onStateChange: (state: ChallengeState, accessToken?: string) => void;
};

export class QrCode {
  private handler: QrHandler;

  constructor({baseUrl, tenantId, mode = "websocket"}: QrCodeOptions) {
    if (mode === "websocket") {
      this.handler = new WebSocketQrHandler({baseUrl, tenantId});
    } else {
      this.handler = new RestQrHandler({baseUrl, tenantId});
    }
  }

  async challenge(params: ChallengeParams): Promise<AuthsignalResponse<QrCodeChallengeResponse>> {
    return this.handler.challenge(params);
  }

  async refresh({custom}: {custom?: Record<string, unknown>} = {}): Promise<void> {
    return this.handler.refresh({custom});
  }

  disconnect(): void {
    this.handler.disconnect();
  }
}
