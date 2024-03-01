import {
  AddAuthenticatorRequest,
  AddAuthenticatorResponse,
  AuthenticationOptsRequest,
  AuthenticationOptsResponse,
  PasskeyAuthenticatorResponse,
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
    const response = fetch(`${this.baseUrl}/client/user-authenticators/passkey/registration-options`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify({username: userName}),
    });

    return (await response).json();
  }

  async authenticationOptions({token}: AuthenticationOptsRequest): Promise<AuthenticationOptsResponse> {
    const response = fetch(`${this.baseUrl}/client/user-authenticators/passkey/authentication-options`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify({}),
    });

    return (await response).json();
  }

  async addAuthenticator({token, ...rest}: AddAuthenticatorRequest): Promise<AddAuthenticatorResponse> {
    const response = fetch(`${this.baseUrl}/client/user-authenticators/passkey`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify(rest),
    });

    return (await response).json();
  }

  async verify({token, ...rest}: VerifyRequest): Promise<VerifyResponse> {
    const response = fetch(`${this.baseUrl}/client/verify/passkey`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify(rest),
    });

    return (await response).json();
  }

  async getPasskeyAuthenticator(credentialId: string): Promise<PasskeyAuthenticatorResponse> {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/passkey?credentialId=${credentialId}`, {
      method: "GET",
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json();
  }

  private buildHeaders(token?: string) {
    const authorizationHeader = token ? `Bearer ${token}` : `Basic ${window.btoa(encodeURIComponent(this.tenantId))}`;

    return {
      "Content-Type": "application/json",
      Authorization: authorizationHeader,
    };
  }
}
