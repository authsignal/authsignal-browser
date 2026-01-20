import {WebSocketClient} from "../api/websocket-client";
import {QrCodeChallengeResponse} from "../api/types/qr-code";
import {AuthsignalResponse} from "../types";
import {ChallengeParams} from "../qr-code";
import {BaseQrHandler} from "./base-qr-handler";
import {TokenCache} from "../token-cache";

export class WebSocketQrHandler extends BaseQrHandler {
  private wsClient: WebSocketClient;
  private cache = TokenCache.shared;
  private enableLogging = false;

  constructor({baseUrl, tenantId, enableLogging}: {baseUrl: string; tenantId: string; enableLogging: boolean}) {
    super();
    this.enableLogging = enableLogging;
    this.wsClient = new WebSocketClient({baseUrl, tenantId});
  }

  async challenge(params: ChallengeParams): Promise<AuthsignalResponse<QrCodeChallengeResponse>> {
    const response = await this.wsClient.createQrCodeChallenge({
      token: this.cache.token || undefined,
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
  }

  async refresh({custom}: {custom?: Record<string, unknown>} = {}): Promise<void> {
    await this.wsClient.refreshQrCodeChallenge({custom});
  }

  disconnect(): void {
    this.wsClient.disconnect();
  }
}
