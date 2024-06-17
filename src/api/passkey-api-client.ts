import {
  AddAuthenticatorRequest,
  AddAuthenticatorResponse,
  AuthenticationOptsRequest,
  AuthenticationOptsResponse,
  AuthsignalResponse,
  ChallengeResponse,
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

  async registrationOptions({
    token,
    username,
    authenticatorAttachment,
  }: {token: string} & RegistrationOptsRequest): Promise<AuthsignalResponse<RegistrationOptsResponse>> {
    const body: RegistrationOptsRequest = Boolean(authenticatorAttachment)
      ? {username, authenticatorAttachment}
      : {username};

    const response = fetch(`${this.baseUrl}/client/user-authenticators/passkey/registration-options`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify(body),
    });

    return (await response).json();
  }

  async authenticationOptions({
    token,
    challengeId,
  }: {token?: string} & AuthenticationOptsRequest): Promise<AuthsignalResponse<AuthenticationOptsResponse>> {
    const body: AuthenticationOptsRequest = {challengeId};

    const response = fetch(`${this.baseUrl}/client/user-authenticators/passkey/authentication-options`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify(body),
    });

    return (await response).json();
  }

  async addAuthenticator({
    token,
    challengeId,
    registrationCredential,
  }: {token: string} & AddAuthenticatorRequest): Promise<AuthsignalResponse<AddAuthenticatorResponse>> {
    const body: AddAuthenticatorRequest = {
      challengeId,
      registrationCredential,
    };

    const response = fetch(`${this.baseUrl}/client/user-authenticators/passkey`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify(body),
    });

    return (await response).json();
  }

  async verify({
    token,
    challengeId,
    authenticationCredential,
    deviceId,
  }: {token?: string} & VerifyRequest): Promise<AuthsignalResponse<VerifyResponse>> {
    const body: VerifyRequest = {challengeId, authenticationCredential, deviceId};

    const response = fetch(`${this.baseUrl}/client/verify/passkey`, {
      method: "POST",
      headers: this.buildHeaders(token),
      body: JSON.stringify(body),
    });

    return (await response).json();
  }

  async getPasskeyAuthenticator(credentialId: string): Promise<AuthsignalResponse<PasskeyAuthenticatorResponse>> {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/passkey?credentialId=${credentialId}`, {
      method: "GET",
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json();
  }

  async challenge(action: string): Promise<AuthsignalResponse<ChallengeResponse>> {
    const response = fetch(`${this.baseUrl}/client/challenge`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({action}),
    });

    return (await response).json();
  }

  private buildHeaders(token?: string) {
    const authorizationHeader = token ? `Bearer ${token}` : `Basic ${window.btoa(encodeURIComponent(this.tenantId))}`;

    return {
      "Content-Type": "application/json",
      Authorization: authorizationHeader,
    };
  }
}
