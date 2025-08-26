import {buildHeaders, handleTokenExpired} from "./helpers";
import {ApiClientOptions, ChallengeResponse, ErrorResponse, VerifyResponse} from "./types/shared";

export class WhatsappApiClient {
  tenantId: string;
  baseUrl: string;
  onTokenExpired?: () => void;

  constructor({baseUrl, tenantId, onTokenExpired}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
    this.onTokenExpired = onTokenExpired;
  }

  async challenge({token}: {token: string}): Promise<ChallengeResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/challenge/whatsapp`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async verify({token, code}: {token: string; code: string}): Promise<VerifyResponse | ErrorResponse> {
    const body = {verificationCode: code};

    const response = await fetch(`${this.baseUrl}/client/verify/whatsapp`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }
}
