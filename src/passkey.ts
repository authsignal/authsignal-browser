import {startAuthentication, startRegistration} from "@simplewebauthn/browser";

import {PasskeyApiClient} from "./api";
import {AuthenticationResponseJSON, RegistrationResponseJSON, AuthenticatorAttachment} from "@simplewebauthn/types";
import {logErrorResponse} from "./helpers";

type PasskeyOptions = {
  baseUrl: string;
  tenantId: string;
  anonymousId: string;
};

type SignUpParams = {
  userName?: string;
  userDisplayName?: string;
  token: string;
  authenticatorAttachment?: AuthenticatorAttachment | null;
};

type SignUpResponse = {
  token?: string;
};

type SignInResponse = {
  token?: string;
  userId?: string;
  userAuthenticatorId?: string;
  userName?: string;
  userDisplayName?: string;
};

export class Passkey {
  public api: PasskeyApiClient;
  private passkeyLocalStorageKey = "as_passkey_credential_id";
  private anonymousId: string;

  constructor({baseUrl, tenantId, anonymousId}: PasskeyOptions) {
    this.api = new PasskeyApiClient({baseUrl, tenantId});
    this.anonymousId = anonymousId;
  }

  async signUp({
    userName,
    userDisplayName,
    token,
    authenticatorAttachment = "platform",
  }: SignUpParams): Promise<SignUpResponse | undefined> {
    const optionsInput = {
      username: userName,
      displayName: userDisplayName,
      token,
      authenticatorAttachment,
    };

    const optionsResponse = await this.api.registrationOptions(optionsInput);

    if ("error" in optionsResponse) {
      logErrorResponse(optionsResponse);
      return;
    }

    const registrationResponse = await startRegistration(optionsResponse.options);

    const addAuthenticatorResponse = await this.api.addAuthenticator({
      challengeId: optionsResponse.challengeId,
      registrationCredential: registrationResponse,
      token,
    });

    if ("error" in addAuthenticatorResponse) {
      logErrorResponse(addAuthenticatorResponse);
      return;
    }

    if (addAuthenticatorResponse.isVerified) {
      this.storeCredentialAgainstDevice(registrationResponse);
    }

    return {
      token: addAuthenticatorResponse.accessToken,
    };
  }

  async signIn(): Promise<SignInResponse | undefined>;
  async signIn(params?: {action: string; autofill?: boolean}): Promise<SignInResponse | undefined>;
  async signIn(params?: {token: string}): Promise<SignInResponse | undefined>;
  async signIn(params?: {autofill: boolean}): Promise<SignInResponse | undefined>;
  async signIn(
    params?: {token?: string; autofill?: boolean; action?: string} | undefined
  ): Promise<SignInResponse | undefined> {
    if (params?.token && params.autofill) {
      throw new Error("autofill is not supported when providing a token");
    }

    if (params?.action && params.token) {
      throw new Error("action is not supported when providing a token");
    }

    const challengeResponse = params?.action ? await this.api.challenge(params.action) : null;

    if (challengeResponse && "error" in challengeResponse) {
      logErrorResponse(challengeResponse);
      return;
    }

    const optionsResponse = await this.api.authenticationOptions({
      token: params?.token,
      challengeId: challengeResponse?.challengeId,
    });

    if ("error" in optionsResponse) {
      logErrorResponse(optionsResponse);
      return;
    }

    const authenticationResponse = await startAuthentication(optionsResponse.options, params?.autofill);

    const verifyResponse = await this.api.verify({
      challengeId: optionsResponse.challengeId,
      authenticationCredential: authenticationResponse,
      token: params?.token,
      deviceId: this.anonymousId,
    });

    if ("error" in verifyResponse) {
      logErrorResponse(verifyResponse);
      return;
    }

    if (verifyResponse.isVerified) {
      this.storeCredentialAgainstDevice(authenticationResponse);
    }

    const {accessToken: token, userId, userAuthenticatorId, username: userName, userDisplayName} = verifyResponse;

    return {
      token,
      userId,
      userAuthenticatorId,
      userName,
      userDisplayName,
    };
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
