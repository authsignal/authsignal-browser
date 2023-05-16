import ky from "ky";
import {KyInstance} from "ky/distribution/types/ky";
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
  api: KyInstance;

  constructor({baseUrl, tenantId}: PasskeyApiClientOptions) {
    this.tenantId = tenantId;

    this.api = ky.create({
      prefixUrl: baseUrl,
    });
  }

  async registrationOptions({token, userName}: RegistrationOptsRequest): Promise<RegistrationOptsResponse> {
    const response = await this.api.post("user-authenticators/passkey/registration-options", {
      json: {userName},
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.json();
  }

  async authenticationOptions({token}: AuthenticationOptsRequest): Promise<AuthenticationOptsResponse> {
    const authorizationHeader = token ? `Bearer ${token}` : `Basic ${Buffer.from(this.tenantId).toString("base64")}`;

    const response = await this.api.post("user-authenticators/passkey/authentication-options", {
      json: {},
      headers: {
        Authorization: authorizationHeader,
      },
    });

    return response.json();
  }

  async addAuthenticator({token, ...rest}: AddAuthenticatorRequest): Promise<AddAuthenticatorResponse> {
    const response = await this.api.post("user-authenticators/passkey", {
      json: rest,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.json();
  }

  async verify({token, ...rest}: VerifyRequest): Promise<VerifyResponse> {
    const authorizationHeader = token ? `Bearer ${token}` : `Basic ${Buffer.from(this.tenantId).toString("base64")}`;

    const response = await this.api.post("verify/passkey", {
      json: rest,
      headers: {
        Authorization: authorizationHeader,
      },
    });

    return response.json();
  }
}
