import {ChallengeResponse, VerifyResponse} from "./types";

type AuthsignalApiClientOptions = {
  baseUrl: string;
  tenantId: string;
};

export class AuthsignalApiClient {
  tenantId: string;
  baseUrl: string;

  constructor({baseUrl, tenantId}: AuthsignalApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
  }

  async challenge(action: string): Promise<ChallengeResponse> {
    const response = fetch(`${this.baseUrl}/client/challenge`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({action}),
    });

    return (await response).json();
  }

  async verify({challengeId}: {challengeId: string}): Promise<AnonymousVerifyResponse> {
    const body = {challengeId};

    const response = fetch(`${this.baseUrl}/client/verify`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    return (await response).json();
  }

  private buildHeaders(token?: string) {
    const authorizationHeader = token ? `Bearer ${token}` : `Basic ${window.btoa(encodeURIComponent(this.tenantId))}`;

    return {
      "Content-Type": "application/json",
      Authorization: authorizationHeader,
    };
  }
}

export type AnonymousVerifyResponse = VerifyResponse & {isClaimed: boolean; isConsumed: boolean};
