import {SmsApiClient} from "./api/sms-api-client";
import {handleApiResponse} from "./helpers";
import {TokenCache} from "./token-cache";
import {AuthsignalResponse, ChallengeResponse, EnrollResponse, VerifyResponse} from "./types";

type SmsOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
};

type EnrollParams = {
  phoneNumber: string;
};

type VerifyParams = {
  code: string;
};

export class Sms {
  private api: SmsApiClient;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, onTokenExpired}: SmsOptions) {
    this.api = new SmsApiClient({baseUrl, tenantId, onTokenExpired});
  }

  async enroll({phoneNumber}: EnrollParams): Promise<AuthsignalResponse<EnrollResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.enroll({token: this.cache.token, phoneNumber});

    return handleApiResponse(response);
  }

  async challenge(): Promise<AuthsignalResponse<ChallengeResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.challenge({token: this.cache.token});

    return handleApiResponse(response);
  }

  async verify({code}: VerifyParams): Promise<AuthsignalResponse<VerifyResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.verify({token: this.cache.token, code});

    if ("accessToken" in response && response.accessToken) {
      this.cache.token = response.accessToken;
    }

    return handleApiResponse(response);
  }
}
