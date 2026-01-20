import {WhatsappApiClient} from "./api/whatsapp-api-client";
import {ChallengeResponse} from "./api/types/shared";
import {handleApiResponse} from "./helpers";
import {TokenCache} from "./token-cache";
import {AuthsignalResponse, VerifyResponse} from "./types";

type WhatsappOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
  enableLogging: boolean;
};

type VerifyParams = {
  code: string;
};

export class Whatsapp {
  private api: WhatsappApiClient;
  private cache = TokenCache.shared;
  private enableLogging = false;

  constructor({baseUrl, tenantId, onTokenExpired, enableLogging}: WhatsappOptions) {
    this.enableLogging = enableLogging;
    this.api = new WhatsappApiClient({baseUrl, tenantId, onTokenExpired});
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
