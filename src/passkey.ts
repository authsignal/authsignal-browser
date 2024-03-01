import {startAuthentication, startRegistration} from "@simplewebauthn/browser";

import {PasskeyApiClient} from "./api";
import {AuthenticationResponseJSON, RegistrationResponseJSON} from "@simplewebauthn/types";

type PasskeyOptions = {
  baseUrl: string;
  tenantId: string;
};

type SignUpParams = {
  userName?: string;
  token: string;
};

export class Passkey {
  public api: PasskeyApiClient;
  private passkeyLocalStorageKey = "as_passkey_credential_id";

  constructor({baseUrl, tenantId}: PasskeyOptions) {
    this.api = new PasskeyApiClient({baseUrl, tenantId});
  }

  async signUp({userName, token}: SignUpParams) {
    const optionsResponse = await this.api.registrationOptions({userName, token});

    const registrationResponse = await startRegistration(optionsResponse.options);

    const addAuthenticatorResponse = await this.api.addAuthenticator({
      challengeId: optionsResponse.challengeId,
      registrationCredential: registrationResponse,
      token,
    });

    if (addAuthenticatorResponse?.isVerified) {
      this.storeCredentialAgainstDevice(registrationResponse);
    }

    return addAuthenticatorResponse?.accessToken;
  }

  async signIn(): Promise<string | undefined>;
  async signIn(params?: {token: string}): Promise<string | undefined>;
  async signIn(params?: {autofill: boolean}): Promise<string | undefined>;
  async signIn(params?: {token?: string; autofill?: boolean} | undefined) {
    if (params?.token && params.autofill) {
      throw new Error("Autofill is not supported when providing a token");
    }

    const optionsResponse = await this.api.authenticationOptions({token: params?.token});

    const authenticationResponse = await startAuthentication(optionsResponse.options, params?.autofill);

    const verifyResponse = await this.api.verify({
      challengeId: optionsResponse.challengeId,
      authenticationCredential: authenticationResponse,
      token: params?.token,
    });

    if (verifyResponse?.isVerified) {
      this.storeCredentialAgainstDevice(authenticationResponse);
    }

    return verifyResponse?.accessToken;
  }

  async isAvailableOnDevice() {
    const credentialId = localStorage.getItem(this.passkeyLocalStorageKey);

    if (!credentialId) {
      return false;
    }

    try {
      await this.api.getPasskeyAuthenticator(credentialId);

      return true;
    } catch (e) {
      return false;
    }
  }

  private storeCredentialAgainstDevice({
    id,
    authenticatorAttachment,
  }: AuthenticationResponseJSON | RegistrationResponseJSON) {
    if (authenticatorAttachment === "cross-platform") {
      return;
    }

    localStorage.setItem(this.passkeyLocalStorageKey, id);
  }
}
