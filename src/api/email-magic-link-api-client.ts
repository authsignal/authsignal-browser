import {buildHeaders, handleTokenExpired} from "./helpers";
import {ApiClientOptions, ChallengeResponse, EnrollResponse, ErrorResponse, VerifyResponse} from "./types/shared";

export class EmailMagicLinkApiClient {
  tenantId: string;
  baseUrl: string;
  onTokenExpired?: () => void;

  constructor({baseUrl, tenantId, onTokenExpired}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
    this.onTokenExpired = onTokenExpired;
  }

  async enroll({token, email}: {token: string; email: string}): Promise<EnrollResponse | ErrorResponse> {
    const body = {email};

    const response = await fetch(`${this.baseUrl}/client/user-authenticators/email-magic-link`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async challenge({token}: {token: string}): Promise<ChallengeResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/challenge/email-magic-link`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async checkVerificationStatus({token}: {token: string}): Promise<VerifyResponse | ErrorResponse> {
    const pollVerificationStatus = async (): Promise<VerifyResponse | ErrorResponse> => {
      const response = await fetch(`${this.baseUrl}/client/verify/email-magic-link/finalize`, {
        method: "POST",
        headers: buildHeaders({token, tenantId: this.tenantId}),
        body: JSON.stringify({}),
      });

      const responseJson = await response.json();

      handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

      if (responseJson.isVerified) {
        return responseJson;
      } else {
        return new Promise((resolve) => {
          setTimeout(async () => {
            resolve(await pollVerificationStatus());
          }, 1000);
        });
      }
    };

    return await pollVerificationStatus();
  }
}
