import {buildHeaders} from "./helpers";
import {ApiClientOptions, ChallengeResponse, EnrollResponse, VerifyResponse} from "./types/shared";

export class SmsApiClient {
  tenantId: string;
  baseUrl: string;

  constructor({baseUrl, tenantId}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
  }

  async enroll({token, phoneNumber}: {token: string; phoneNumber: string}): Promise<EnrollResponse> {
    const body = {phoneNumber};

    const response = fetch(`${this.baseUrl}/client/user-authenticators/sms`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    return (await response).json();
  }

  async challenge({token}: {token: string}): Promise<ChallengeResponse> {
    const response = fetch(`${this.baseUrl}/client/challenge/sms`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
    });

    return (await response).json();
  }

  async verify({token, code}: {token: string; code: string}): Promise<VerifyResponse> {
    const body = {verificationCode: code};

    const response = fetch(`${this.baseUrl}/client/verify/sms`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    return (await response).json();
  }
}
