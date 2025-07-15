import {WebSocketClient} from "../api/websocket-client";
import {QrCodeChallengeResponse} from "../api/types/qr-code";
import {AuthsignalResponse} from "../types";
import {ChallengeParams} from "../qr-code";
import {BaseQrHandler} from "./base-qr-handler";

export class WebSocketQrHandler extends BaseQrHandler {
  private wsClient: WebSocketClient;

  constructor({baseUrl, tenantId}: {baseUrl: string; tenantId: string}) {
    super();
    this.wsClient = new WebSocketClient({baseUrl, tenantId});
  }

  async challenge(params: ChallengeParams): Promise<AuthsignalResponse<QrCodeChallengeResponse>> {
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
  }

  async refresh({custom}: {custom?: Record<string, unknown>} = {}): Promise<void> {
    await this.wsClient.refreshQrCodeChallenge({custom});
  }

  disconnect(): void {
    this.wsClient.disconnect();
  }
}
