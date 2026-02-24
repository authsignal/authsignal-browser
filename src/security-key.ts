import {
  startAuthentication,
  startRegistration,
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  PublicKeyCredentialHint,
} from "@simplewebauthn/browser";

import {TokenCache} from "./token-cache";
import {handleErrorResponse, handleWebAuthnError} from "./helpers";
import {AuthsignalResponse} from "./types";
import {SecurityKeyApiClient} from "./api/security-key-api-client";

type SecurityKeyOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
  enableLogging: boolean;
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
  private enableLogging = false;

  constructor({baseUrl, tenantId, onTokenExpired, enableLogging}: SecurityKeyOptions) {
    this.api = new SecurityKeyApiClient({baseUrl, tenantId, onTokenExpired});
    this.enableLogging = enableLogging;
  }

  async enroll({hints}: {hints?: PublicKeyCredentialHint[]} = {}): Promise<AuthsignalResponse<EnrollResponse>> {
    if (!this.cache.token) {
      return this.cache.handleTokenNotSetError();
    }

    const optionsInput = {
      token: this.cache.token,
    };

    const optionsResponse = await this.api.registrationOptions(optionsInput);

    if ("error" in optionsResponse) {
      return handleErrorResponse({errorResponse: optionsResponse, enableLogging: this.enableLogging});
    }

    try {
      const optionsJSON = hints ? {...optionsResponse, hints} : optionsResponse;

      const registrationResponse = await startRegistration({optionsJSON});

      const addAuthenticatorResponse = await this.api.addAuthenticator({
        registrationCredential: registrationResponse,
        token: this.cache.token,
      });

      if ("error" in addAuthenticatorResponse) {
        return handleErrorResponse({errorResponse: addAuthenticatorResponse, enableLogging: this.enableLogging});
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
      return handleErrorResponse({errorResponse: optionsResponse, enableLogging: this.enableLogging});
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
        return handleErrorResponse({errorResponse: verifyResponse, enableLogging: this.enableLogging});
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
