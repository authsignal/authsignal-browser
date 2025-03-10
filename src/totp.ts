import {TotpApiClient} from "./api/totp-api-client";
import {EnrollTotpResponse} from "./api/types/totp";
import {handleApiResponse} from "./helpers";
import {TokenCache} from "./token-cache";
import {AuthsignalResponse, VerifyResponse} from "./types";

type TotpOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
};

type VerifyParams = {
  code: string;
};

export class Totp {
  private api: TotpApiClient;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, onTokenExpired}: TotpOptions) {
    this.api = new TotpApiClient({baseUrl, tenantId, onTokenExpired});
  }

  async enroll(): Promise<AuthsignalResponse<EnrollTotpResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.enroll({token: this.cache.token});

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
