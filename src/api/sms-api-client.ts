import {buildHeaders, handleTokenExpired} from "./helpers";
import {ApiClientOptions, ChallengeResponse, EnrollResponse, ErrorResponse, VerifyResponse} from "./types/shared";

export class SmsApiClient {
  tenantId: string;
  baseUrl: string;
  onTokenExpired?: () => void;

  constructor({baseUrl, tenantId, onTokenExpired}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
    this.onTokenExpired = onTokenExpired;
  }

  async enroll({token, phoneNumber}: {token: string; phoneNumber: string}): Promise<EnrollResponse | ErrorResponse> {
    const body = {phoneNumber};

    const response = await fetch(`${this.baseUrl}/client/user-authenticators/sms`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async challenge({token}: {token: string}): Promise<ChallengeResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/challenge/sms`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async verify({token, code}: {token: string; code: string}): Promise<VerifyResponse | ErrorResponse> {
    const body = {verificationCode: code};

    const response = await fetch(`${this.baseUrl}/client/verify/sms`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }
}
