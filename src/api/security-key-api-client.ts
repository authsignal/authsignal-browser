import {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import {buildHeaders, handleTokenExpired} from "./helpers";
import {AddAuthenticatorResponse, ErrorResponse, VerifyResponse} from "./types/passkey";
import {ApiClientOptions} from "./types/shared";

export class SecurityKeyApiClient {
  tenantId: string;
  baseUrl: string;
  onTokenExpired?: () => void;

  constructor({baseUrl, tenantId, onTokenExpired}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
    this.onTokenExpired = onTokenExpired;
  }

  async registrationOptions({token}: {token: string}): Promise<PublicKeyCredentialCreationOptionsJSON | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/security-key/registration-options`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify({}),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async authenticationOptions({
    token,
  }: {
    token?: string;
  }): Promise<PublicKeyCredentialRequestOptionsJSON | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/security-key/authentication-options`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify({}),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async addAuthenticator({
    token,
    registrationCredential,
  }: {
    token: string;
    registrationCredential: RegistrationResponseJSON;
  }): Promise<AddAuthenticatorResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/security-key`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(registrationCredential),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async verify({
    token,
    authenticationCredential,
  }: {
    token?: string;
    authenticationCredential: AuthenticationResponseJSON;
  }): Promise<VerifyResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/verify/security-key`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(authenticationCredential),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }
}
