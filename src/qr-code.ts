import {QrCodeApiClient} from "./api/qr-code-api-client";
import {QrCodeChallengeResponse, QrCodeVerifyResponse} from "./api/types/qr-code";
import {WebSocketClient} from "./api/websocket-client";
import {ChallengeState, WebSocketQrCodeOptions} from "./api/types/websocket";
import {handleApiResponse} from "./helpers";
import {AuthsignalResponse} from "./types";

type QrCodeMode = "websocket" | "polling";

type QrCodeOptions = {
  baseUrl: string;
  tenantId: string;
  mode?: QrCodeMode;
};

type ChallengeParams = {
  action: string;
  custom?: Record<string, unknown>;
  /** The interval in milliseconds at which the QR code challenge will be refreshed. Default: 9 minutes */
  refreshInterval?: number;
  /** A callback function that is called when the QR code challenge is refreshed. */
  onRefresh?: (challengeId: string, expiresAt: string) => void;
  /** A callback function that is called when the state of the QR code challenge changes. */
  onStateChange?: (state: ChallengeState, accessToken?: string) => void;
};

type VerifyParams = {
  challengeId: string;
  deviceCode: string;
};

export class QrCode {
  private api: QrCodeApiClient;
  private wsClient: WebSocketClient;
  private mode: QrCodeMode;

  constructor({baseUrl, tenantId, mode = "websocket"}: QrCodeOptions) {
    this.api = new QrCodeApiClient({baseUrl, tenantId});
    this.wsClient = new WebSocketClient({baseUrl, tenantId});
    this.mode = mode;
  }

  async challenge(params: ChallengeParams): Promise<AuthsignalResponse<QrCodeChallengeResponse>> {
    if (this.mode === "websocket") {
      try {
        if (!params.onStateChange) {
          throw new Error("onStateChange is required");
        }

        const response = await this.wsClient.createQrCodeChallenge({
          action: params.action,
          custom: params.custom,
          refreshInterval: params.refreshInterval,
          onRefresh: params.onRefresh,
          onStateChange: params.onStateChange,
        });

        return {
          data: {
            challengeId: response.challengeId,
            expiresAt: response.expiresAt,
          } as QrCodeChallengeResponse,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } else {
      const response = await this.api.challenge({action: params.action, custom: params.custom});
      return handleApiResponse(response);
    }
  }

  async verify({challengeId, deviceCode}: VerifyParams): Promise<AuthsignalResponse<QrCodeVerifyResponse>> {
    const response = await this.api.verify({challengeId, deviceCode});

    return handleApiResponse(response);
  }

  async refresh({custom}: {custom?: Record<string, any>} = {}): Promise<void> {
    await this.wsClient.refreshQrCodeChallenge({custom});
  }

  disconnect(): void {
    this.wsClient.disconnect();
  }
}
