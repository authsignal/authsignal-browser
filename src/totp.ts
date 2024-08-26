import {TotpApiClient} from "./api/totp-api-client";
import {AuthsignalResponse, VerifyResponse} from "./api/types/shared";
import {EnrollResponse} from "./api/types/totp";
import {TokenCache} from "./token-cache";

type TotpOptions = {
  baseUrl: string;
  tenantId: string;
};

type VerifyParams = {
  code: string;
};

export class Totp {
  private api: TotpApiClient;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId}: TotpOptions) {
    this.api = new TotpApiClient({baseUrl, tenantId});
  }

  async enroll(): Promise<AuthsignalResponse<EnrollResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    return this.api.enroll({token: this.cache.token});
  }

  async verify({code}: VerifyParams): Promise<AuthsignalResponse<VerifyResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    return this.api.verify({token: this.cache.token, code});
  }
}
