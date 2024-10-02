import {EmailApiClient} from "./api/email-api-client";
import {TokenCache} from "./token-cache";

type EmailOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
};

type EnrollParams = {
  email: string;
};

type VerifyParams = {
  code: string;
};

export class Email {
  private api: EmailApiClient;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, onTokenExpired}: EmailOptions) {
    this.api = new EmailApiClient({baseUrl, tenantId, onTokenExpired});
  }

  async enroll({email}: EnrollParams) {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    return this.api.enroll({token: this.cache.token, email});
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
