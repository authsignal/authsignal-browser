import {PushApiClient} from "./api/push-api-client";
import {PushChallengeResponse, PushVerifyResponse} from "./api/types/push";
import {handleApiResponse} from "./helpers";
import {TokenCache} from "./token-cache";
import {AuthsignalResponse} from "./types";

type PushOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
};

type VerifyParams = {
  challengeId: string;
};

export class Push {
  private api: PushApiClient;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, onTokenExpired}: PushOptions) {
    this.api = new PushApiClient({baseUrl, tenantId, onTokenExpired});
  }

  async challenge(): Promise<AuthsignalResponse<PushChallengeResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.challenge({token: this.cache.token});

    return handleApiResponse(response);
  }

  async verify({challengeId}: VerifyParams): Promise<AuthsignalResponse<PushVerifyResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const response = await this.api.verify({challengeId, token: this.cache.token});

    return handleApiResponse(response);
  }
}
