import {startAuthentication, startRegistration} from "@simplewebauthn/browser";

import {AuthenticationResponseJSON, RegistrationResponseJSON} from "@simplewebauthn/types";
import {TokenCache} from "./token-cache";
import {handleErrorResponse, handleWebAuthnError} from "./helpers";
import {AuthsignalResponse} from "./types";
import {SecurityKeyApiClient} from "./api/security-key-api-client";

type SecurityKeyOptions = {
  baseUrl: string;
  tenantId: string;
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
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, onTokenExpired}: SecurityKeyOptions) {
    this.api = new SecurityKeyApiClient({baseUrl, tenantId, onTokenExpired});
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

    try {
      const registrationResponse = await startRegistration({optionsJSON: optionsResponse});

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
    } catch (e) {
      handleWebAuthnError(e);

      throw e;
    }
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

    try {
      const authenticationResponse = await startAuthentication({
        optionsJSON: optionsResponse,
      });

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
    } catch (e) {
      handleWebAuthnError(e);

      throw e;
    }
  }
}
