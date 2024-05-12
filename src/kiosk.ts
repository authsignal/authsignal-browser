import {AnonymousVerifyResponse, AuthsignalApiClient} from "./api/authsignal-api-client";

type KioskOptions = {
  baseUrl: string;
  tenantId: string;
};

export class Kiosk {
  public api: AuthsignalApiClient;

  constructor({baseUrl, tenantId}: KioskOptions) {
    this.api = new AuthsignalApiClient({baseUrl, tenantId});
  }

  async challenge(params: {action: string}): Promise<string> {
    const result = await this.api.challenge(params.action);

    return result.challengeId;
  }

  async verify(params: {challengeId: string}): Promise<AnonymousVerifyResponse> {
    return await this.api.verify({challengeId: params.challengeId});
  }
}
