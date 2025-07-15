import {QrCodeApiClient} from "../api/qr-code-api-client";
import {QrCodeChallengeResponse} from "../api/types/qr-code";
import {ChallengeState} from "../api/types/websocket";
import {handleApiResponse} from "../helpers";
import {AuthsignalResponse} from "../types";
import {ChallengeParams} from "../qr-code";
import {BaseQrHandler} from "./base-qr-handler";

const DEFAULT_REFRESH_INTERVAL = 9 * 60 * 1000;
const DEFAULT_POLL_INTERVAL = 5 * 1000;

export class RestQrHandler extends BaseQrHandler {
  private api: QrCodeApiClient;
  private pollingInterval?: NodeJS.Timeout;
  private refreshTimeout?: NodeJS.Timeout;
  private currentChallengeParams?: ChallengeParams;

  constructor({baseUrl, tenantId}: {baseUrl: string; tenantId: string}) {
    super();
    this.api = new QrCodeApiClient({baseUrl, tenantId});
  }

  async challenge(params: ChallengeParams): Promise<AuthsignalResponse<QrCodeChallengeResponse>> {
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
        const onRefresh = params.onRefresh;
        this.startRefreshTimer(
          () => this.performRefresh(params.action, params.custom, onRefresh, params.onStateChange, pollInterval),
          refreshInterval
        );
      }
    }

    return result;
  }

  async refresh({custom}: {custom?: Record<string, unknown>} = {}): Promise<void> {
    if (!this.currentChallengeParams) return;

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
          pollInterval: this.currentChallengeParams.pollInterval || DEFAULT_POLL_INTERVAL,
        });
      }

      if (this.currentChallengeParams.onRefresh) {
        const refreshInterval = this.currentChallengeParams.refreshInterval || DEFAULT_REFRESH_INTERVAL;
        const {action, custom, onRefresh, onStateChange, pollInterval} = this.currentChallengeParams;
        this.startRefreshTimer(
          () => this.performRefresh(action, custom, onRefresh, onStateChange, pollInterval || DEFAULT_POLL_INTERVAL),
          refreshInterval
        );
      }
    }
  }

  disconnect(): void {
    this.clearPolling();
    this.clearRefreshTimer();
    this.currentChallengeParams = undefined;
  }

  private startRefreshTimer(callback: () => Promise<void>, interval: number): void {
    this.clearRefreshTimer();
    this.refreshTimeout = setTimeout(async () => {
      await callback();
      this.startRefreshTimer(callback, interval);
    }, interval);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = undefined;
    }
  }

  private async performRefresh(
    action: string,
    custom: Record<string, unknown> | undefined,
    onRefresh: (challengeId: string, expiresAt: string) => void,
    onStateChange: (state: ChallengeState, accessToken?: string) => void,
    pollInterval: number
  ): Promise<void> {
    const response = await this.api.challenge({action, custom});
    const result = handleApiResponse(response);

    if (result.data) {
      this.clearPolling();
      onRefresh(result.data.challengeId, result.data.expiresAt);

      if (result.data.deviceCode) {
        this.startPolling({
          challengeId: result.data.challengeId,
          deviceCode: result.data.deviceCode,
          onStateChange,
          pollInterval,
        });
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

  private clearPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }
}
