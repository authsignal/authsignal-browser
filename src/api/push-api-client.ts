import {buildHeaders, handleTokenExpired} from "./helpers";
import {ApiClientOptions, ErrorResponse} from "./types/shared";
import {PushChallengeResponse, PushVerifyResponse} from "./types/push";

export class PushApiClient {
  tenantId: string;
  baseUrl: string;
  onTokenExpired?: () => void;

  constructor({baseUrl, tenantId, onTokenExpired}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
    this.onTokenExpired = onTokenExpired;
  }

  async challenge({token}: {token: string}): Promise<PushChallengeResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/challenge/push`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async verify({
    challengeId,
    token,
  }: {
    challengeId: string;
    token: string;
  }): Promise<PushVerifyResponse | ErrorResponse> {
    const body = {challengeId};

    const response = await fetch(`${this.baseUrl}/client/verify/push`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }
}
