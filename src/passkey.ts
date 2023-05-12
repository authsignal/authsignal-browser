import {startAuthentication, startRegistration} from "@simplewebauthn/browser";

import {PasskeyApiClient} from "./api";

type PasskeyOptions = {
  baseUrl: string;
  tenantId: string;
};

export class Passkey {
  private api: PasskeyApiClient;

  constructor({baseUrl, tenantId}: PasskeyOptions) {
    this.api = new PasskeyApiClient({baseUrl, tenantId});
  }

  async signUp({userName, token}: {userName: string; token: string}) {
    const optsResponse = await this.api.registrationOptions({userName, token});

    try {
      const attReponse = await startRegistration(optsResponse.options);

      const addAuthenticatorResponse = await this.api.addAuthenticator({
        challengeId: optsResponse.challengeId,
        authenticationCredential: attReponse,
        token,
      });

      return addAuthenticatorResponse?.accessToken;
    } catch (error) {
      console.error(error);
    }
  }

  async signIn({userName, token}: {userName: string; token?: string}) {
    const optsResponse = await this.api.authenticationOptions({userName, token});

    try {
      const asseReponse = await startAuthentication(optsResponse.options);

      const verifyResponse = await this.api.verify({
        challengeId: optsResponse.challengeId,
        authenticationCredential: asseReponse,
        token,
      });

      return verifyResponse?.accessToken;
    } catch (error) {
      console.error(error);
    }
  }
}
