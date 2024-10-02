import {SmsApiClient} from "./api/sms-api-client";
import {TokenCache} from "./token-cache";

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

  async enroll({phoneNumber}: EnrollParams) {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    return this.api.enroll({token: this.cache.token, phoneNumber});
  }

  async challenge() {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    return this.api.challenge({token: this.cache.token});
  }

  async verify({code}: VerifyParams) {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const verifyResponse = await this.api.verify({token: this.cache.token, code});

    if ("accessToken" in verifyResponse && verifyResponse.accessToken) {
      this.cache.token = verifyResponse.accessToken;
    }

    return verifyResponse;
  }
}
