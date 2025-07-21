import {buildHeaders} from "./helpers";
import {ApiClientOptions, ErrorResponse} from "./types/shared";
import {QrCodeChallengeResponse, QrCodeVerifyResponse} from "./types/qr-code";

export class QrCodeApiClient {
  tenantId: string;
  baseUrl: string;

  constructor({baseUrl, tenantId}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
  }

  async challenge({
    action,
    token,
    custom,
  }: {
    action: string;
    token?: string;
    custom?: Record<string, unknown>;
  }): Promise<QrCodeChallengeResponse | ErrorResponse> {
    const body = {action, custom};

    const response = await fetch(`${this.baseUrl}/client/challenge/qr-code`, {
      method: "POST",
      headers: buildHeaders({tenantId: this.tenantId, token}),
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    return responseJson;
  }

  async verify({
    challengeId,
    deviceCode,
  }: {
    challengeId: string;
    deviceCode: string;
  }): Promise<QrCodeVerifyResponse | ErrorResponse> {
    const body = {challengeId, deviceCode};

    const response = await fetch(`${this.baseUrl}/client/verify/qr-code`, {
      method: "POST",
      headers: buildHeaders({tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    return responseJson;
  }
}
