import {buildHeaders} from "./helpers";
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
      headers: buildHeaders({token, tenantId: this.tenantId}),
    });

    return (await response).json();
  }

  async verify({token, code}: {token: string; code: string}): Promise<VerifyResponse> {
    const body = {verificationCode: code};

    const response = fetch(`${this.baseUrl}/client/verify/totp`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    return (await response).json();
  }
}
