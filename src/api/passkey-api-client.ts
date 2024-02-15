import {
  AddAuthenticatorRequest,
  AddAuthenticatorResponse,
  AuthenticationOptsRequest,
  AuthenticationOptsResponse,
  RegistrationOptsRequest,
  RegistrationOptsResponse,
  VerifyRequest,
  VerifyResponse,
} from "./types";

type PasskeyApiClientOptions = {
  baseUrl: string;
  tenantId: string;
};

export class PasskeyApiClient {
  tenantId: string;
  baseUrl: string;

  constructor({baseUrl, tenantId}: PasskeyApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
  }

  async registrationOptions({token, userName}: RegistrationOptsRequest): Promise<RegistrationOptsResponse> {
    const request = fetch(`${this.baseUrl}/client/user-authenticators/passkey/registration-options`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify({username: userName}),
    });

    return (await request).json();
  }

  async authenticationOptions({token}: AuthenticationOptsRequest): Promise<AuthenticationOptsResponse> {
    const request = fetch(`${this.baseUrl}/client/user-authenticators/passkey/authentication-options`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify({}),
    });

    return (await request).json();
  }

  async addAuthenticator({token, ...rest}: AddAuthenticatorRequest): Promise<AddAuthenticatorResponse> {
    const request = fetch(`${this.baseUrl}/client/user-authenticators/passkey`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify(rest),
    });

    return (await request).json();
  }

  async verify({token, ...rest}: VerifyRequest): Promise<VerifyResponse> {
    const request = fetch(`${this.baseUrl}/client/verify/passkey`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify(rest),
    });

    return (await request).json();
  }

  private buildHeaders(token?: string) {
    const authorizationHeader = token ? `Bearer ${token}` : `Basic ${window.btoa(encodeURIComponent(this.tenantId))}`;

    return {
      "Content-Type": "application/json",
      Authorization: authorizationHeader,
    };
  }
}
