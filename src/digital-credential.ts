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
};

export class DigitalCredential {
  public api: DigitalCredentialApiClient;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, onTokenExpired}: DigitalCredentialOptions) {
    this.api = new DigitalCredentialApiClient({baseUrl, tenantId, onTokenExpired});
  }

  async requestCredential(params?: RequestCredentialParams): Promise<AuthsignalResponse<RequestCredentialResponse>> {
    const userToken = params?.token ?? this.cache.token;

    if (!(await this.browserSupportsDigitalCredential())) {
      throw new Error("Digital Credential API is not supported in this browser");
    }

    const challengeResponse = params?.action ? await this.api.challenge(params.action) : null;

    if (challengeResponse && "error" in challengeResponse) {
      return handleErrorResponse(challengeResponse);
    }

    const optionsResponse = await this.api.presentationOptions({
      token: userToken || undefined,
      challengeId: challengeResponse?.challengeId,
    });

    if ("error" in optionsResponse) {
      return handleErrorResponse(optionsResponse);
    }

    const {dcapiOptions, challengeId} = optionsResponse;

    try {
      const credentialResponse = await navigator.credentials.get(dcapiOptions);

      if (!credentialResponse) {
        throw new Error("No credential was provided");
      }

      // @ts-expect-error - Digital Credential API is experimental
      const {data} = credentialResponse;

      const verifyResponse = await this.api.verifyPresentation({
        token: userToken || undefined,
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
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        throw new Error("User cancelled the credential request");
      }

      throw error;
    }
  }

  async browserSupportsDigitalCredential(): Promise<boolean> {
    if (typeof window !== "undefined" && "DigitalCredential" in window) {
      return typeof window.DigitalCredential === "function";
    }

    return false;
  }
}
