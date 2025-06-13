import {QrCodeApiClient} from "./api/qr-code-api-client";
import {QrCodeChallengeResponse, QrCodeVerifyResponse} from "./api/types/qr-code";
import {handleApiResponse} from "./helpers";
import {AuthsignalResponse} from "./types";

type QrCodeOptions = {
  baseUrl: string;
  tenantId: string;
};

type ChallengeParams = {
  action: string;
};

type VerifyParams = {
  challengeId: string;
  deviceCode: string;
};

export class QrCode {
  private api: QrCodeApiClient;

  constructor({baseUrl, tenantId}: QrCodeOptions) {
    this.api = new QrCodeApiClient({baseUrl, tenantId});
  }

  async challenge({action}: ChallengeParams): Promise<AuthsignalResponse<QrCodeChallengeResponse>> {
    const response = await this.api.challenge({action});

    return handleApiResponse(response);
  }

  async verify({challengeId, deviceCode}: VerifyParams): Promise<AuthsignalResponse<QrCodeVerifyResponse>> {
    const response = await this.api.verify({challengeId, deviceCode});

    return handleApiResponse(response);
  }
}
