import {EmailMagicLinkApiClient} from "./api/email-magic-link-api-client";
import {handleApiResponse} from "./helpers";
import {TokenCache} from "./token-cache";
import {AuthsignalResponse, ChallengeResponse, EnrollResponse, CheckVerificationStatusResponse} from "./types";

type EmailMagicLinkOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
};

type EnrollParams = {
  email: string;
};

export class EmailMagicLink {
  private api: EmailMagicLinkApiClient;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, onTokenExpired}: EmailMagicLinkOptions) {
    this.api = new EmailMagicLinkApiClient({baseUrl, tenantId, onTokenExpired});
  }

  async enroll({email}: EnrollParams): Promise<AuthsignalResponse<EnrollResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.enroll({token: this.cache.token, email});

    return handleApiResponse(response);
  }

  async challenge(): Promise<AuthsignalResponse<ChallengeResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.challenge({token: this.cache.token});

    return handleApiResponse(response);
  }

  async checkVerificationStatus(): Promise<AuthsignalResponse<CheckVerificationStatusResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.checkVerificationStatus({token: this.cache.token});

    if ("accessToken" in response && response.accessToken) {
      this.cache.token = response.accessToken;
    }

    return handleApiResponse(response);
  }
}
