import {DigitalCredentialApiClient} from "./api/digital-credential-api-client";
import {TokenCache} from "./token-cache";
import {handleErrorResponse} from "./helpers";
import {AuthsignalResponse} from "./types";

type DigitalCredentialOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
};

type RequestCredentialParams = {
  action?: string;
  token?: string;
};

type RequestCredentialResponse = {
  isVerified: boolean;
  token?: string;
  username?: string;
  userId?: string;
};

export class DigitalCredential {
  public api: DigitalCredentialApiClient;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, onTokenExpired}: DigitalCredentialOptions) {
    this.api = new DigitalCredentialApiClient({baseUrl, tenantId, onTokenExpired});
  }

  async requestCredential(params?: RequestCredentialParams): Promise<AuthsignalResponse<RequestCredentialResponse>> {
    if (!this.browserSupportsDigitalCredential()) {
      throw new Error("Digital Credential API is not supported in this browser");
    }

    const challengeResponse = params?.action ? await this.api.challenge(params.action) : null;

    if (challengeResponse && "error" in challengeResponse) {
      return handleErrorResponse(challengeResponse);
    }

    const optionsResponse = await this.api.presentationOptions({
      token: params?.token || undefined,
      challengeId: challengeResponse?.challengeId,
    });

    if ("error" in optionsResponse) {
      return handleErrorResponse(optionsResponse);
    }

    const {dcapiOptions, challengeId} = optionsResponse;

    const credentialResponse = await navigator.credentials.get(dcapiOptions);

    if (!credentialResponse) {
      throw new Error("No credential was provided");
    }

    // @ts-expect-error - Digital Credential API is experimental
    const {data} = credentialResponse;

    const verifyResponse = await this.api.verifyPresentation({
      token: params?.token || undefined,
      data,
      nonce: dcapiOptions.digital?.requests?.[0]?.data?.nonce,
      challengeId,
    });

    if ("error" in verifyResponse) {
      return handleErrorResponse(verifyResponse);
    }

    if (verifyResponse.accessToken) {
      this.cache.token = verifyResponse.accessToken;
    }

    return {
      data: {
        isVerified: verifyResponse.isVerified,
        token: verifyResponse.accessToken,
        username: verifyResponse.username,
        userId: verifyResponse.userId,
      },
    };
  }

  browserSupportsDigitalCredential(): boolean {
    if (typeof window !== "undefined" && "DigitalCredential" in window) {
      return typeof window.DigitalCredential === "function";
    }

    return false;
  }
}
