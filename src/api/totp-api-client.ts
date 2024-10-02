import {buildHeaders, handleTokenExpired} from "./helpers";
import {ApiClientOptions, AuthsignalResponse, VerifyResponse} from "./types/shared";
import {EnrollResponse} from "./types/totp";

export class TotpApiClient {
  tenantId: string;
  baseUrl: string;
  onTokenExpired?: () => void;

  constructor({baseUrl, tenantId, onTokenExpired}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
    this.onTokenExpired = onTokenExpired;
  }

  async enroll({token}: {token: string}) {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/totp`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
    });

    const responseJson: AuthsignalResponse<EnrollResponse> = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async verify({token, code}: {token: string; code: string}) {
    const body = {verificationCode: code};

    const response = await fetch(`${this.baseUrl}/client/verify/totp`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    const responseJson: AuthsignalResponse<VerifyResponse> = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }
}
