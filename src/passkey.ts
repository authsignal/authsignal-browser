import {startAuthentication, startRegistration} from "@simplewebauthn/browser";

import {PasskeyApiClient} from "./api";
import {AuthenticationResponseJSON, RegistrationResponseJSON, AuthenticatorAttachment} from "@simplewebauthn/types";

type PasskeyOptions = {
  baseUrl: string;
  tenantId: string;
  anonymousId: string;
};

type SignUpParams = {
  userName?: string;
  token: string;
  authenticatorAttachment?: AuthenticatorAttachment | null;
};

export class Passkey {
  public api: PasskeyApiClient;
  private passkeyLocalStorageKey = "as_passkey_credential_id";
  private anonymousId: string;

  constructor({baseUrl, tenantId, anonymousId}: PasskeyOptions) {
    this.api = new PasskeyApiClient({baseUrl, tenantId});
    this.anonymousId = anonymousId;
  }

  async signUp({userName, token, authenticatorAttachment = "platform"}: SignUpParams) {
    const optionsResponse = await this.api.registrationOptions({username: userName, token, authenticatorAttachment});

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
  async signIn(params?: {token?: string; autofill?: boolean; action?: string} | undefined) {
    if (params?.token && params.autofill) {
      throw new Error("autofill is not supported when providing a token");
    }

    if (params?.action && params.token) {
      throw new Error("action is not supported when providing a token");
    }

    const challengeResponse = params?.action ? await this.api.challenge(params.action) : null;

    const optionsResponse = await this.api.authenticationOptions({
      token: params?.token,
      challengeId: challengeResponse?.challengeId,
    });

    const authenticationResponse = await startAuthentication(optionsResponse.options, params?.autofill);

    const verifyResponse = await this.api.verify({
      challengeId: optionsResponse.challengeId,
      authenticationCredential: authenticationResponse,
      token: params?.token,
      deviceId: this.anonymousId,
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
    } catch {
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
