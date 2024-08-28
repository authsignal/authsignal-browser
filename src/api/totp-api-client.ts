import {ApiClientOptions, VerifyResponse} from "./types/shared";
import {EnrollResponse} from "./types/totp";

export class TotpApiClient {
  tenantId: string;
  baseUrl: string;

  constructor({baseUrl, tenantId}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
  }

  async enroll({token}: {token: string}): Promise<EnrollResponse> {
    const response = fetch(`${this.baseUrl}/client/user-authenticators/totp`, {
      method: "POST",
      headers: this.buildHeaders(token),
    });

    return (await response).json();
  }

  async verify({token, code}: {token: string; code: string}): Promise<VerifyResponse> {
    const body = {code};

    const response = fetch(`${this.baseUrl}/client/verify/totp`, {
      method: "POST",
      headers: this.buildHeaders(token),
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
