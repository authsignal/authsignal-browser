import {
  startAuthentication,
  startRegistration,
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  AuthenticatorAttachment,
} from "@simplewebauthn/browser";

import {PasskeyApiClient} from "./api/passkey-api-client";
import {TokenCache} from "./token-cache";
import {handleErrorResponse, handleWebAuthnError} from "./helpers";
import {AuthsignalResponse} from "./types";
import {Authenticator} from "./api/types/shared";

type PasskeyOptions = {
  baseUrl: string;
  tenantId: string;
  anonymousId: string;
  onTokenExpired?: () => void;
};

type SignUpParams = {
  token?: string;
  username?: string;
  displayName?: string;
  authenticatorAttachment?: AuthenticatorAttachment | null;
  useAutoRegister?: boolean;
  useCookies?: boolean;
};

type SignUpResponse = {
  token?: string;
  userAuthenticator?: Authenticator;
  registrationResponse?: RegistrationResponseJSON;
};

type SignInParams = {
  autofill?: boolean;
  action?: string;
  token?: string;
  useCookies?: boolean;
  onVerificationStarted?: () => unknown;
};

type SignInResponse = {
  isVerified: boolean;
  token?: string;
  userId?: string;
  userAuthenticatorId?: string;
  username?: string;
  displayName?: string;
  authenticationResponse?: AuthenticationResponseJSON;
};

let autofillRequestPending = false;

export class Passkey {
  public api: PasskeyApiClient;
  private passkeyLocalStorageKey = "as_user_passkey_map";
  private anonymousId: string;
  private cache = TokenCache.shared;

  constructor({baseUrl, tenantId, anonymousId, onTokenExpired}: PasskeyOptions) {
    this.api = new PasskeyApiClient({baseUrl, tenantId, onTokenExpired});
    this.anonymousId = anonymousId;
  }

  async signUp({
    username,
    displayName,
    token,
    authenticatorAttachment = "platform",
    useAutoRegister = false,
    useCookies = false,
  }: SignUpParams): Promise<AuthsignalResponse<SignUpResponse>> {
    const userToken = token ?? this.cache.token;

    if (!userToken) {
      return this.cache.handleTokenNotSetError();
    }

    if (useAutoRegister) {
      if (!(await this.doesBrowserSupportConditionalCreate())) {
        throw new Error("CONDITIONAL_CREATE_NOT_SUPPORTED");
      }
    }

    const optionsInput = {
      username,
      displayName,
      token: userToken,
      authenticatorAttachment,
      useCookies,
    };

    const optionsResponse = await this.api.registrationOptions(optionsInput);

    if ("error" in optionsResponse) {
      return handleErrorResponse(optionsResponse);
    }

    try {
      const registrationResponse = await startRegistration({optionsJSON: optionsResponse.options, useAutoRegister});

      const addAuthenticatorResponse = await this.api.addAuthenticator({
        registrationCredential: registrationResponse,
        token: userToken,
        conditionalCreate: useAutoRegister,
        useCookies,
      });

      if ("error" in addAuthenticatorResponse) {
        return handleErrorResponse(addAuthenticatorResponse);
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
        data: {
          token: addAuthenticatorResponse.accessToken,
          userAuthenticator: addAuthenticatorResponse.userAuthenticator,
          registrationResponse,
        },
      };
    } catch (e) {
      autofillRequestPending = false;

      handleWebAuthnError(e);

      throw e;
    }
  }

  async signIn(params?: SignInParams): Promise<AuthsignalResponse<SignInResponse>> {
    if (params?.token && params.autofill) {
      throw new Error("autofill is not supported when providing a token");
    }

    if (params?.action && params.token) {
      throw new Error("action is not supported when providing a token");
    }

    if (params?.autofill) {
      if (autofillRequestPending) {
        return {};
      } else {
        autofillRequestPending = true;
      }
    }

    const challengeResponse = params?.action
      ? await this.api.challenge({action: params?.action, useCookies: params?.useCookies})
      : null;

    if (challengeResponse && "error" in challengeResponse) {
      autofillRequestPending = false;

      return handleErrorResponse(challengeResponse);
    }

    const optionsResponse =
      params?.action || !params?.useCookies
        ? await this.api.authenticationOptions({token: params?.token, useCookies: params?.useCookies})
        : await this.api.authenticationOptionsWeb({token: params?.token});

    if ("error" in optionsResponse) {
      autofillRequestPending = false;

      return handleErrorResponse(optionsResponse);
    }

    try {
      const authenticationResponse = await startAuthentication({
        optionsJSON: optionsResponse.options,
        useBrowserAutofill: params?.autofill,
      });

      if (params?.onVerificationStarted) {
        params.onVerificationStarted();
      }

      const verifyResponse = await this.api.verify({
        authenticationCredential: authenticationResponse,
        token: params?.token,
        deviceId: this.anonymousId,
        challengeId: optionsResponse.challengeId,
        useCookies: params?.useCookies,
      });

      if ("error" in verifyResponse) {
        autofillRequestPending = false;

        return handleErrorResponse(verifyResponse);
      }

      if (verifyResponse.isVerified) {
        this.storeCredentialAgainstDevice({...authenticationResponse, userId: verifyResponse.userId});
      }

      if (verifyResponse.accessToken) {
        this.cache.token = verifyResponse.accessToken;
      }

      const {accessToken: token, userId, userAuthenticatorId, username, userDisplayName, isVerified} = verifyResponse;

      autofillRequestPending = false;

      return {
        data: {
          isVerified,
          token,
          userId,
          userAuthenticatorId,
          username,
          displayName: userDisplayName,
          authenticationResponse,
        },
      };
    } catch (e) {
      autofillRequestPending = false;

      handleWebAuthnError(e);

      throw e;
    }
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

  private async doesBrowserSupportConditionalCreate() {
    // @ts-expect-error types are not up to date
    if (window.PublicKeyCredential && PublicKeyCredential.getClientCapabilities) {
      // @ts-expect-error types are not up to date
      const capabilities = await PublicKeyCredential.getClientCapabilities();
      if (capabilities.conditionalCreate) {
        return true;
      }
    }

    return false;
  }
}
