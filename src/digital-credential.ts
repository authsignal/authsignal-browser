import {DigitalCredentialApiClient} from "./api/digital-credential-api-client";
import {TokenCache} from "./token-cache";
import {handleErrorResponse} from "./helpers";
import {AuthsignalResponse} from "./types";
import {browserSupportsDigitalCredential} from "./utils";
// @ts-expect-error - not typed
import {requestCredentials} from "id-verifier";

type DigitalCredentialOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
  enableLogging: boolean;
};

type VerifyParams = {
  action?: string;
  token?: string;
  redirectUrl?: string;
};

type VerifyResponse = {
  isVerified: boolean;
  token?: string;
  username?: string;
  userId?: string;
  url?: string;
  requireUserVerification?: boolean;
  claims?: Record<string, string>;
};

type VerifyClaimsParams = {
  action?: string;
  documentTypes?: string[];
  claims?: string[][];
  redirectUrl?: string;
};

type VerifyClaimsResponse = {
  isVerified: boolean;
  claims?: Record<string, string>;
  url?: string;
  requireUserVerification?: boolean;
};

export class DigitalCredential {
  public api: DigitalCredentialApiClient;
  private cache = TokenCache.shared;
  private enableLogging = false;

  constructor({baseUrl, tenantId, onTokenExpired, enableLogging}: DigitalCredentialOptions) {
    this.api = new DigitalCredentialApiClient({baseUrl, tenantId, onTokenExpired});
    this.enableLogging = enableLogging;
  }

  async verify(params?: VerifyParams): Promise<AuthsignalResponse<VerifyResponse>> {
    if (!browserSupportsDigitalCredential()) {
      throw new Error("Digital Credential API is not supported in this browser");
    }

    const challengeResponse = params?.action ? await this.api.challenge(params.action) : null;

    if (challengeResponse && "error" in challengeResponse) {
      return handleErrorResponse({errorResponse: challengeResponse, enableLogging: this.enableLogging});
    }

    const optionsResponse = await this.api.presentationOptions({
      token: params?.token || undefined,
      challengeId: challengeResponse?.challengeId,
      action: params?.action || undefined,
    });

    if ("error" in optionsResponse) {
      return handleErrorResponse({errorResponse: optionsResponse, enableLogging: this.enableLogging});
    }

    const {dcapiOptions, challengeId} = optionsResponse;

    const credentialResponse = await requestCredentials(dcapiOptions);

    if (!credentialResponse) {
      throw new Error("No credential was provided");
    }

    const verifyResponse = await this.api.verifyPresentation({
      token: params?.token || undefined,
      data: credentialResponse,
      challengeId,
      redirectUrl: params?.redirectUrl,
    });

    if ("error" in verifyResponse) {
      return handleErrorResponse({errorResponse: verifyResponse, enableLogging: this.enableLogging});
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
        requireUserVerification: verifyResponse.requireUserVerification,
        url: verifyResponse.url,
        claims: verifyResponse.claims,
      },
    };
  }

  async verifyClaims(params?: VerifyClaimsParams): Promise<AuthsignalResponse<VerifyClaimsResponse>> {
    if (!browserSupportsDigitalCredential()) {
      throw new Error("Digital Credential API is not supported in this browser");
    }

    const optionsResponse = await this.api.presentationOptions({
      action: params?.action || undefined,
      anonymous: true,
      documentTypes: params?.documentTypes,
      claims: params?.claims,
    });

    if ("error" in optionsResponse) {
      return handleErrorResponse({errorResponse: optionsResponse, enableLogging: this.enableLogging});
    }

    const {dcapiOptions, challengeId} = optionsResponse;

    const credentialResponse = await requestCredentials(dcapiOptions);

    if (!credentialResponse) {
      throw new Error("No credential was provided");
    }

    const verifyResponse = await this.api.verifyPresentation({
      data: credentialResponse,
      challengeId,
      redirectUrl: params?.redirectUrl,
    });

    if ("error" in verifyResponse) {
      return handleErrorResponse({errorResponse: verifyResponse, enableLogging: this.enableLogging});
    }

    return {
      data: {
        isVerified: verifyResponse.isVerified,
        claims: verifyResponse.claims,
        requireUserVerification: verifyResponse.requireUserVerification,
        url: verifyResponse.url,
      },
    };
  }
}
