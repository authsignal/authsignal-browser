import {startAuthentication, startRegistration} from "@simplewebauthn/browser";

import {PasskeyApiClient} from "./api";
import {AuthenticationResponseJSON, RegistrationResponseJSON, AuthenticatorAttachment} from "@simplewebauthn/types";
import {logErrorResponse} from "./helpers";
import {TokenCache} from "./token-cache";
import {AuthsignalResponse} from "./api/types/shared";

type PasskeyOptions = {
  baseUrl: string;
  tenantId: string;
  anonymousId: string;
};

type SignUpParams = {
  userName?: string;
  userDisplayName?: string;
  token?: string;
  authenticatorAttachment?: AuthenticatorAttachment | null;
};

type SignUpResponse = {
  token?: string;
  registrationResponse?: RegistrationResponseJSON;
};

type SignInParams = {
  token?: string;
  autofill?: boolean;
  action?: string;
  onVerificationStarted?: () => unknown;
};

type SignInResponse = {
  token?: string;
  userId?: string;
  userAuthenticatorId?: string;
  userName?: string;
  userDisplayName?: string;
  authenticationResponse?: AuthenticationResponseJSON;
};

export class Passkey {
  public api: PasskeyApiClient;
  private passkeyLocalStorageKey = "as_user_passkey_map";
  private anonymousId: string;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, anonymousId}: PasskeyOptions) {
    this.api = new PasskeyApiClient({baseUrl, tenantId});
    this.anonymousId = anonymousId;
  }

  async signUp({
    userName,
    userDisplayName,
    token,
    authenticatorAttachment = "platform",
  }: SignUpParams): Promise<AuthsignalResponse<SignUpResponse>> {
    const userToken = token ?? this.cache.token;

    if (!userToken) {
      return this.cache.handleTokenNotSetError();
    }

    const optionsInput = {
      username: userName,
      displayName: userDisplayName,
      token: userToken,
      authenticatorAttachment,
    };

    const optionsResponse = await this.api.registrationOptions(optionsInput);

    if ("error" in optionsResponse) {
      logErrorResponse(optionsResponse);

      return optionsResponse;
    }

    const registrationResponse = await startRegistration(optionsResponse.options);

    const addAuthenticatorResponse = await this.api.addAuthenticator({
      challengeId: optionsResponse.challengeId,
      registrationCredential: registrationResponse,
      token: userToken,
    });

    if ("error" in addAuthenticatorResponse) {
      logErrorResponse(addAuthenticatorResponse);

      return addAuthenticatorResponse;
    }

    if (addAuthenticatorResponse.isVerified) {
      this.storeCredentialAgainstDevice({
        ...registrationResponse,
        userId: addAuthenticatorResponse.userId,
      });
    }

    if (addAuthenticatorResponse.accessToken) {
      this.cache.token = addAuthenticatorResponse.accessToken;
    }

    return {
      token: addAuthenticatorResponse.accessToken,
      registrationResponse,
    };
  }

  async signIn(params?: SignInParams): Promise<AuthsignalResponse<SignInResponse>> {
    if (params?.token && params.autofill) {
      throw new Error("autofill is not supported when providing a token");
    }

    if (params?.action && params.token) {
      throw new Error("action is not supported when providing a token");
    }

    const challengeResponse = params?.action ? await this.api.challenge(params.action) : null;

    if (challengeResponse && "error" in challengeResponse) {
      logErrorResponse(challengeResponse);

      return challengeResponse;
    }

    const optionsResponse = await this.api.authenticationOptions({
      token: params?.token,
      challengeId: challengeResponse?.challengeId,
    });

    if ("error" in optionsResponse) {
      logErrorResponse(optionsResponse);

      return optionsResponse;
    }

    const authenticationResponse = await startAuthentication(optionsResponse.options, params?.autofill);

    if (params?.onVerificationStarted) {
      params.onVerificationStarted();
    }

    const verifyResponse = await this.api.verify({
      challengeId: optionsResponse.challengeId,
      authenticationCredential: authenticationResponse,
      token: params?.token,
      deviceId: this.anonymousId,
    });

    if ("error" in verifyResponse) {
      logErrorResponse(verifyResponse);

      return verifyResponse;
    }

    if (verifyResponse.isVerified) {
      this.storeCredentialAgainstDevice({...authenticationResponse, userId: verifyResponse.userId});
    }

    if (verifyResponse.accessToken) {
      this.cache.token = verifyResponse.accessToken;
    }

    const {accessToken: token, userId, userAuthenticatorId, username: userName, userDisplayName} = verifyResponse;

    return {
      token,
      userId,
      userAuthenticatorId,
      userName,
      userDisplayName,
      authenticationResponse,
    };
  }

  async isAvailableOnDevice({userId}: {userId: string}) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const storedCredentials = localStorage.getItem(this.passkeyLocalStorageKey);

    if (!storedCredentials) {
      return false;
    }

    const credentialsMap = JSON.parse(storedCredentials) as Record<string, string[]>;

    const credentialIds = credentialsMap[userId] ?? [];

    if (credentialIds.length === 0) {
      return false;
    }

    try {
      await this.api.getPasskeyAuthenticator({credentialIds});

      return true;
    } catch {
      return false;
    }
  }

  private storeCredentialAgainstDevice({
    id,
    authenticatorAttachment,
    userId = "",
  }: (AuthenticationResponseJSON | RegistrationResponseJSON) & {userId?: string}) {
    if (authenticatorAttachment === "cross-platform") {
      return;
    }

    const storedCredentials = localStorage.getItem(this.passkeyLocalStorageKey);
    const credentialsMap = storedCredentials ? JSON.parse(storedCredentials) : {};

    if (credentialsMap[userId]) {
      if (!credentialsMap[userId].includes(id)) {
        credentialsMap[userId].push(id);
      }
    } else {
      credentialsMap[userId] = [id];
    }

    localStorage.setItem(this.passkeyLocalStorageKey, JSON.stringify(credentialsMap));
  }
}
