import {buildHeaders, handleTokenExpired} from "./helpers";
import {ErrorResponse} from "./types/passkey";
import {ApiClientOptions, ChallengeResponse} from "./types/shared";
import {
  PresentationOptionsRequest,
  PresentationOptionsResponse,
  VerifyPresentationRequest,
  VerifyPresentationResponse,
} from "./types/digital-credential";

export class DigitalCredentialApiClient {
  tenantId: string;
  baseUrl: string;
  onTokenExpired?: () => void;

  constructor({baseUrl, tenantId, onTokenExpired}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
    this.onTokenExpired = onTokenExpired;
  }

  async presentationOptions({
    challengeId,
    token,
    mode,
  }: PresentationOptionsRequest): Promise<PresentationOptionsResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/digital-credential/presentation-options`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify({challengeId, mode}),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async verifyPresentation({
    token,
    data,
    nonce,
    challengeId,
    mode,
  }: VerifyPresentationRequest): Promise<VerifyPresentationResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/digital-credential/verify-presentation`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify({data, nonce, challengeId, mode}),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async challenge(action: string): Promise<ChallengeResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/challenge`, {
      method: "POST",
      headers: buildHeaders({tenantId: this.tenantId}),
      body: JSON.stringify({action}),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }
}
