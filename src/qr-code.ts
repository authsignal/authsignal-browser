import {QrCodeApiClient} from "./api/qr-code-api-client";
import {QrCodeChallengeResponse} from "./api/types/qr-code";
import {WebSocketClient} from "./api/websocket-client";
import {ChallengeState} from "./api/types/websocket";
import {handleApiResponse} from "./helpers";
import {AuthsignalResponse} from "./types";

type Mode = "websocket" | "rest";

type QrCodeOptions = {
  baseUrl: string;
  tenantId: string;
  mode: Mode;
};

type ChallengeParams = {
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

const DEFAULT_REFRESH_INTERVAL = 9 * 60 * 1000;
const DEFAULT_POLL_INTERVAL = 5 * 1000;

export class QrCode {
  private api: QrCodeApiClient;
  private wsClient: WebSocketClient;
  private mode: Mode;
  private pollingInterval?: NodeJS.Timeout;
  private refreshTimeout?: NodeJS.Timeout;
  private currentChallengeParams?: ChallengeParams;

  constructor({baseUrl, tenantId, mode = "websocket"}: QrCodeOptions) {
    this.api = new QrCodeApiClient({baseUrl, tenantId});
    this.wsClient = new WebSocketClient({baseUrl, tenantId});
    this.mode = mode;
  }

  async challenge(params: ChallengeParams): Promise<AuthsignalResponse<QrCodeChallengeResponse>> {
    if (this.mode === "websocket") {
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
    } else {
      const response = await this.api.challenge({action: params.action, custom: params.custom});
      const result = handleApiResponse(response);

      if (result.data) {
        this.currentChallengeParams = params;

        this.clearPolling();

        const pollInterval = params.pollInterval || DEFAULT_POLL_INTERVAL;
        const refreshInterval = params.refreshInterval || DEFAULT_REFRESH_INTERVAL;

        if (result.data.deviceCode) {
          this.startPolling({
            challengeId: result.data.challengeId,
            deviceCode: result.data.deviceCode,
            onStateChange: params.onStateChange,
            pollInterval,
          });
        }

        if (params.onRefresh) {
          this.startRefreshTimer({
            refreshInterval,
            onRefresh: params.onRefresh,
            action: params.action,
            custom: params.custom,
            onStateChange: params.onStateChange,
            pollInterval,
          });
        }
      }

      return result;
    }
  }

  async refresh({custom}: {custom?: Record<string, unknown>} = {}): Promise<void> {
    if (this.mode === "websocket") {
      await this.wsClient.refreshQrCodeChallenge({custom});
    } else {
      if (this.currentChallengeParams) {
        const response = await this.api.challenge({
          action: this.currentChallengeParams.action,
          custom: custom || this.currentChallengeParams.custom,
        });
        const result = handleApiResponse(response);

        if (result.data) {
          this.clearPolling();

          if (this.currentChallengeParams.onRefresh) {
            this.currentChallengeParams.onRefresh(result.data.challengeId, result.data.expiresAt);
          }

          if (result.data.deviceCode) {
            this.startPolling({
              challengeId: result.data.challengeId,
              deviceCode: result.data.deviceCode,
              onStateChange: this.currentChallengeParams.onStateChange,
              pollInterval: DEFAULT_POLL_INTERVAL,
            });
          }

          if (this.currentChallengeParams.onRefresh) {
            this.startRefreshTimer({
              refreshInterval: this.currentChallengeParams.refreshInterval || DEFAULT_REFRESH_INTERVAL,
              onRefresh: this.currentChallengeParams.onRefresh,
              action: this.currentChallengeParams.action,
              custom: this.currentChallengeParams.custom,
              onStateChange: this.currentChallengeParams.onStateChange,
              pollInterval: DEFAULT_POLL_INTERVAL,
            });
          }
        }
      }
    }
  }

  private startPolling({
    challengeId,
    deviceCode,
    onStateChange,
    pollInterval,
  }: {
    challengeId: string;
    deviceCode: string;
    onStateChange: (state: ChallengeState, accessToken?: string) => void;
    pollInterval: number;
  }): void {
    this.pollingInterval = setInterval(async () => {
      const response = await this.api.verify({challengeId, deviceCode});
      const result = handleApiResponse(response);

      if (result.data) {
        if (result.data.isVerified) {
          onStateChange("approved", result.data.token);
          this.clearPolling();
        } else if (result.data.isClaimed) {
          onStateChange("claimed");
        }
      }
    }, pollInterval);
  }

  private startRefreshTimer({
    refreshInterval,
    onRefresh,
    action,
    custom,
    onStateChange,
    pollInterval,
  }: {
    refreshInterval: number;
    onRefresh: (challengeId: string, expiresAt: string) => void;
    action: string;
    custom?: Record<string, unknown>;
    onStateChange: (state: ChallengeState, accessToken?: string) => void;
    pollInterval?: number;
  }): void {
    this.refreshTimeout = setTimeout(async () => {
      const response = await this.api.challenge({action, custom});
      const result = handleApiResponse(response);

      if (result.data) {
        this.clearPolling();

        onRefresh(result.data.challengeId, result.data.expiresAt);

        if (result.data.deviceCode && pollInterval) {
          this.startPolling({
            challengeId: result.data.challengeId,
            deviceCode: result.data.deviceCode,
            onStateChange,
            pollInterval,
          });
        }

        this.startRefreshTimer({
          refreshInterval,
          onRefresh,
          action,
          custom,
          onStateChange,
          pollInterval,
        });
      }
    }, refreshInterval);
  }

  private clearPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = undefined;
    }
  }

  disconnect(): void {
    if (this.mode === "websocket") {
      this.wsClient.disconnect();
    } else {
      this.clearPolling();
      this.currentChallengeParams = undefined;
    }
  }
}
