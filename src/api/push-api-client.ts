import {buildHeaders} from "./helpers";
import {ApiClientOptions, ErrorResponse} from "./types/shared";
import {PushChallengeResponse, PushVerifyResponse} from "./types/push";

export class PushApiClient {
  tenantId: string;
  baseUrl: string;

  constructor({baseUrl, tenantId}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
  }

  async challenge({action}: {action: string}): Promise<PushChallengeResponse | ErrorResponse> {
    const body = {action};

    const response = await fetch(`${this.baseUrl}/client/challenge/push`, {
      method: "POST",
      headers: buildHeaders({tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    return responseJson;
  }

  async verify({
    challengeId,
  }: {
    challengeId: string;
  }): Promise<PushVerifyResponse | ErrorResponse> {
    const body = {challengeId};

    const response = await fetch(`${this.baseUrl}/client/verify/push`, {
      method: "POST",
      headers: buildHeaders({tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    return responseJson;
  }
} 