import {TotpApiClient} from "./api/totp-api-client";
import {TokenCache} from "./token-cache";

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

  async enroll() {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    return this.api.enroll({token: this.cache.token});
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
