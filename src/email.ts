import {EmailApiClient} from "./api/email-api-client";
import {AuthsignalResponse, ChallengeResponse, EnrollResponse, VerifyResponse} from "./api/types/shared";
import {TokenCache} from "./token-cache";

type EmailOptions = {
  baseUrl: string;
  tenantId: string;
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

  constructor({baseUrl, tenantId}: EmailOptions) {
    this.api = new EmailApiClient({baseUrl, tenantId});
  }

  async enroll({email}: EnrollParams): Promise<AuthsignalResponse<EnrollResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    return this.api.enroll({token: this.cache.token, email});
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

    const verifyResponse = await this.api.verify({token: this.cache.token, code});

    if (verifyResponse.accessToken) {
      this.cache.token = verifyResponse.accessToken;
    }

    return verifyResponse;
  }
}
