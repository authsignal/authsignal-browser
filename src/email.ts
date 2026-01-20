import {EmailApiClient} from "./api/email-api-client";
import {EnrollResponse, ChallengeResponse} from "./api/types/shared";
import {handleApiResponse} from "./helpers";
import {TokenCache} from "./token-cache";
import {AuthsignalResponse, VerifyResponse} from "./types";

type EmailOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
  enableLogging: boolean;
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
  private enableLogging = false;

  constructor({baseUrl, tenantId, onTokenExpired, enableLogging}: EmailOptions) {
    this.enableLogging = enableLogging;
    this.api = new EmailApiClient({baseUrl, tenantId, onTokenExpired});
  }

  async enroll({email}: EnrollParams): Promise<AuthsignalResponse<EnrollResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.enroll({token: this.cache.token, email});

    return handleApiResponse({response, enableLogging: this.enableLogging});
  }

  async challenge(): Promise<AuthsignalResponse<ChallengeResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.challenge({token: this.cache.token});

    return handleApiResponse({response, enableLogging: this.enableLogging});
  }

  async verify({code}: VerifyParams): Promise<AuthsignalResponse<VerifyResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.verify({token: this.cache.token, code});

    if ("accessToken" in response && response.accessToken) {
      this.cache.token = response.accessToken;
    }

    return handleApiResponse({response, enableLogging: this.enableLogging});
  }
}
