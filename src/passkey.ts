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
    const optsResponse = await this.api.registrationOptions({userName, token});

    try {
      const attReponse = await startRegistration(optsResponse.options);

      const addAuthenticatorResponse = await this.api.addAuthenticator({
        challengeId: optsResponse.challengeId,
        registrationCredential: attReponse,
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
    const optsResponse = await this.api.authenticationOptions({token: params?.token});

    try {
      const asseReponse = await startAuthentication(optsResponse.options, params?.autofill);

      const verifyResponse = await this.api.verify({
        challengeId: optsResponse.challengeId,
        authenticationCredential: asseReponse,
        token: params?.token,
      });

      return verifyResponse?.accessToken;
    } catch (error) {
      console.error(error);
    }
  }
}
