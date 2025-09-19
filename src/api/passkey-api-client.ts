import {buildHeaders, handleTokenExpired} from "./helpers";
import {
  AddAuthenticatorRequest,
  AddAuthenticatorResponse,
  AuthenticationOptsResponse,
  ChallengeResponse,
  ErrorResponse,
  PasskeyAuthenticatorResponse,
  RegistrationOptsRequest,
  RegistrationOptsResponse,
  VerifyRequest,
  VerifyResponse,
} from "./types/passkey";
import {ApiClientOptions} from "./types/shared";

export class PasskeyApiClient {
  tenantId: string;
  baseUrl: string;
  onTokenExpired?: () => void;

  constructor({baseUrl, tenantId, onTokenExpired}: ApiClientOptions) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
    this.onTokenExpired = onTokenExpired;
  }

  async registrationOptions({
    token,
    username,
    authenticatorAttachment,
  }: {token: string} & RegistrationOptsRequest): Promise<RegistrationOptsResponse | ErrorResponse> {
    const body: RegistrationOptsRequest = Boolean(authenticatorAttachment)
      ? {username, authenticatorAttachment}
      : {username};

    const response = await fetch(`${this.baseUrl}/client/user-authenticators/passkey/registration-options/web`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async authenticationOptions({token}: {token?: string}): Promise<AuthenticationOptsResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/passkey/authentication-options`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify({}),
      credentials: "include",
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async authenticationOptionsWeb({token}: {token?: string}): Promise<AuthenticationOptsResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/passkey/authentication-options/web`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify({}),
      credentials: "include",
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async addAuthenticator({
    token,
    registrationCredential,
    conditionalCreate,
  }: {token: string} & AddAuthenticatorRequest): Promise<AddAuthenticatorResponse | ErrorResponse> {
    const body: AddAuthenticatorRequest = {
      registrationCredential,
      conditionalCreate,
    };

    const response = await fetch(`${this.baseUrl}/client/user-authenticators/passkey`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
      credentials: "include",
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async verify({
    authenticationCredential,
    token,
    deviceId,
  }: {token?: string} & VerifyRequest): Promise<VerifyResponse | ErrorResponse> {
    const body: VerifyRequest = {authenticationCredential, deviceId};

    const response = await fetch(`${this.baseUrl}/client/verify/passkey`, {
      method: "POST",
      headers: buildHeaders({token, tenantId: this.tenantId}),
      body: JSON.stringify(body),
      credentials: "include",
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }

  async getPasskeyAuthenticator({
    credentialIds,
  }: {
    credentialIds: string[];
  }): Promise<PasskeyAuthenticatorResponse | ErrorResponse> {
    const response = await fetch(`${this.baseUrl}/client/user-authenticators/passkey?credentialIds=${credentialIds}`, {
      method: "GET",
      headers: buildHeaders({tenantId: this.tenantId}),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json();
  }

  async challenge(action: string): Promise<ChallengeResponse | ErrorResponse> {
    const url = `${this.baseUrl}/client/challenge/web`;

    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders({tenantId: this.tenantId}),
      body: JSON.stringify({action}),
      credentials: "include",
    });

    const responseJson = await response.json();

    handleTokenExpired({response: responseJson, onTokenExpired: this.onTokenExpired});

    return responseJson;
  }
}
