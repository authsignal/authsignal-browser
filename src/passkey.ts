import {startAuthentication, startRegistration} from "@simplewebauthn/browser";

import {PasskeyApiClient} from "./api";

type PasskeyOptions = {
  baseUrl: string;
  tenantId: string;
};

type SignUpParams = {
  userName?: string;
  token: string;
};

export class Passkey {
  private api: PasskeyApiClient;

  constructor({baseUrl, tenantId}: PasskeyOptions) {
    this.api = new PasskeyApiClient({baseUrl, tenantId});
  }

  async signUp({userName, token}: SignUpParams) {
    const optionsResponse = await this.api.registrationOptions({userName, token});

    try {
      const registrationResponse = await startRegistration(optionsResponse.options);

      const addAuthenticatorResponse = await this.api.addAuthenticator({
        challengeId: optionsResponse.challengeId,
        registrationCredential: registrationResponse,
        token,
      });

      return addAuthenticatorResponse?.accessToken;
    } catch (error) {
      console.error(error);
    }
  }

  async signIn(params?: {token: string}): Promise<string | undefined>;
  async signIn(params?: {autofill: boolean}): Promise<string | undefined>;
  async signIn(params?: {token?: string; autofill?: boolean} | undefined) {
    if (params?.token && params.autofill) {
      throw new Error("Autofill is not supported when providing a token");
    }

    const optionsResponse = await this.api.authenticationOptions({token: params?.token});

    try {
      const authenticationResponse = await startAuthentication(optionsResponse.options, params?.autofill);

      const verifyResponse = await this.api.verify({
        challengeId: optionsResponse.challengeId,
        authenticationCredential: authenticationResponse,
        token: params?.token,
      });

      return verifyResponse?.accessToken;
    } catch (error) {
      console.error(error);
    }
  }
}
