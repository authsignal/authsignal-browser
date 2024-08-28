import {ApiClientOptions, ChallengeResponse, EnrollResponse, VerifyResponse} from "./types/shared";

export class EmailApiClient {
  tenantId: string;
  baseUrl: string;

  constructor({baseUrl, tenantId}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
  }

  async enroll({token, email}: {token: string; email: string}): Promise<EnrollResponse> {
    const body = {email};

    const response = fetch(`${this.baseUrl}/client/user-authenticators/email-otp`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify(body),
    });

    return (await response).json();
  }

  async challenge({token}: {token: string}): Promise<ChallengeResponse> {
    const response = fetch(`${this.baseUrl}/client/challenge/email-otp`, {
      method: "POST",
      headers: this.buildHeaders(token),
    });

    return (await response).json();
  }

  async verify({token, code}: {token: string; code: string}): Promise<VerifyResponse> {
    const body = {code};

    const response = fetch(`${this.baseUrl}/client/verify/email-otp`, {
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
