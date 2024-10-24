import {startAuthentication, startRegistration} from "@simplewebauthn/browser";

import {AuthenticationResponseJSON, RegistrationResponseJSON} from "@simplewebauthn/types";
import {TokenCache} from "./token-cache";
import {handleErrorResponse} from "./helpers";
import {AuthsignalResponse} from "./types";
import {SecurityKeyApiClient} from "./api/security-key-api-client";

type SecurityKeyOptions = {
  baseUrl: string;
  tenantId: string;
  anonymousId: string;
  onTokenExpired?: () => void;
};

type EnrollResponse = {
  token?: string;
  registrationResponse?: RegistrationResponseJSON;
};

type VerifyResponse = {
  isVerified: boolean;
  token?: string;
  authenticationResponse?: AuthenticationResponseJSON;
};

export class SecurityKey {
  public api: SecurityKeyApiClient;
  private anonymousId: string;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, anonymousId, onTokenExpired}: SecurityKeyOptions) {
    this.api = new SecurityKeyApiClient({baseUrl, tenantId, onTokenExpired});
    this.anonymousId = anonymousId;
  }

  async enroll(): Promise<AuthsignalResponse<EnrollResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const optionsInput = {
      token: this.cache.token,
    };

    const optionsResponse = await this.api.registrationOptions(optionsInput);

    if ("error" in optionsResponse) {
      return handleErrorResponse(optionsResponse);
    }

    const registrationResponse = await startRegistration(optionsResponse);

    const addAuthenticatorResponse = await this.api.addAuthenticator({
      registrationCredential: registrationResponse,
      token: this.cache.token,
    });

    if ("error" in addAuthenticatorResponse) {
      return handleErrorResponse(addAuthenticatorResponse);
    }

    if (addAuthenticatorResponse.accessToken) {
      this.cache.token = addAuthenticatorResponse.accessToken;
    }

    return {
      data: {
        token: addAuthenticatorResponse.accessToken,
        registrationResponse,
      },
    };
  }

  async verify(): Promise<AuthsignalResponse<VerifyResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const optionsResponse = await this.api.authenticationOptions({
      token: this.cache.token,
    });

    if ("error" in optionsResponse) {
      return handleErrorResponse(optionsResponse);
    }

    const authenticationResponse = await startAuthentication(optionsResponse);

    const verifyResponse = await this.api.verify({
      authenticationCredential: authenticationResponse,
      token: this.cache.token,
    });

    if ("error" in verifyResponse) {
      return handleErrorResponse(verifyResponse);
    }

    if (verifyResponse.accessToken) {
      this.cache.token = verifyResponse.accessToken;
    }

    const {accessToken: token, isVerified} = verifyResponse;

    return {
      data: {
        isVerified,
        token,
        authenticationResponse,
      },
    };
  }
}
