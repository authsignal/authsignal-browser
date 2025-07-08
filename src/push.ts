import {PushApiClient} from "./api/push-api-client";
import {PushChallengeResponse, PushVerifyResponse} from "./api/types/push";
import {handleApiResponse} from "./helpers";
import {AuthsignalResponse} from "./types";

type PushOptions = {
  baseUrl: string;
  tenantId: string;
};

type ChallengeParams = {
  action: string;
};

type VerifyParams = {
  challengeId: string;
};

export class Push {
  private api: PushApiClient;

  constructor({baseUrl, tenantId}: PushOptions) {
    this.api = new PushApiClient({baseUrl, tenantId});
  }

  async challenge({action}: ChallengeParams): Promise<AuthsignalResponse<PushChallengeResponse>> {
    const response = await this.api.challenge({action});

    return handleApiResponse(response);
  }

  async verify({challengeId}: VerifyParams): Promise<AuthsignalResponse<PushVerifyResponse>> {
    const response = await this.api.verify({challengeId});

    return handleApiResponse(response);
  }
} 