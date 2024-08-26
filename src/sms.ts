import {SmsApiClient} from "./api/sms-api-client";
import {AuthsignalResponse, ChallengeResponse, EnrollResponse, VerifyResponse} from "./api/types/shared";
import {TokenCache} from "./token-cache";

type SmsOptions = {
  baseUrl: string;
  tenantId: string;
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

  constructor({baseUrl, tenantId}: SmsOptions) {
    this.api = new SmsApiClient({baseUrl, tenantId});
  }

  async enroll({phoneNumber}: EnrollParams): Promise<AuthsignalResponse<EnrollResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    return this.api.enroll({token: this.cache.token, phoneNumber});
  }

  async challenge(): Promise<AuthsignalResponse<ChallengeResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    return this.api.challenge({token: this.cache.token});
  }

  async verify({code}: VerifyParams): Promise<AuthsignalResponse<VerifyResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    return this.api.verify({token: this.cache.token, code});
  }
}
