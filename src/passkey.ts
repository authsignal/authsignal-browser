import {
  startAuthentication,
  startRegistration,
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  AuthenticatorAttachment,
  PublicKeyCredentialHint,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

import {PasskeyApiClient} from "./api/passkey-api-client";
import {TokenCache} from "./token-cache";
import {
  handleErrorResponse,
  handleWebAuthnError,
  identifyImmediateMediationAuthenticationError,
  isImmediateMediationCredentialNotFoundError,
} from "./helpers";
import {signalAllAcceptedCredentials, signalUnknownCredential} from "./passkey-signal";
import {AuthsignalResponse, ErrorCode} from "./types";
import {Authenticator, VerificationMethod} from "./api/types/shared";
import {AuthenticationOptsResponse} from "./api/types/passkey";

type PasskeyOptions = {
  baseUrl: string;
  tenantId: string;
  anonymousId: string;
  onTokenExpired?: () => void;
  enableLogging: boolean;
};

type SignUpParams = {
  token?: string;
  username?: string;
  displayName?: string;
  authenticatorAttachment?: AuthenticatorAttachment | null;
  hints?: PublicKeyCredentialHint[];
  useAutoRegister?: boolean;
  useCookies?: boolean;
  syncCredentials?: boolean;
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
  syncCredentials?: boolean;
  preferImmediatelyAvailableCredentials?: boolean;
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

type PublicKeyCredentialConstructorWithCapabilities = typeof PublicKeyCredential & {
  getClientCapabilities?: () => Promise<{conditionalCreate?: boolean; immediateGet?: boolean}>;
  parseRequestOptionsFromJSON?: (options: PublicKeyCredentialRequestOptionsJSON) => PublicKeyCredentialRequestOptions;
};

type PublicKeyCredentialWithToJSON = PublicKeyCredential & {
  toJSON: () => AuthenticationResponseJSON;
};

type ImmediateCredentialRequestOptions = CredentialRequestOptions & {
  uiMode: "immediate";
};

let autofillRequestPending = false;

export class Passkey {
  public api: PasskeyApiClient;
  private passkeyLocalStorageKey = "as_user_passkey_map";
  private anonymousId: string;
  private cache = TokenCache.shared;
  private enableLogging = false;

  constructor({baseUrl, tenantId, anonymousId, onTokenExpired, enableLogging}: PasskeyOptions) {
    this.api = new PasskeyApiClient({baseUrl, tenantId, onTokenExpired});
    this.anonymousId = anonymousId;
    this.enableLogging = enableLogging;
  }

  async signUp({
    username,
    displayName,
    token,
    authenticatorAttachment = "platform",
    hints,
    useAutoRegister = false,
    useCookies = false,
    syncCredentials = true,
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
      return handleErrorResponse({errorResponse: optionsResponse, enableLogging: this.enableLogging});
    }

    try {
      const optionsJSON = hints ? {...optionsResponse.options, hints} : optionsResponse.options;

      const registrationResponse = await startRegistration({optionsJSON, useAutoRegister});

      const addAuthenticatorResponse = await this.api.addAuthenticator({
        registrationCredential: registrationResponse,
        token: userToken,
        conditionalCreate: useAutoRegister,
        challengeId: optionsResponse.challengeId,
        useCookies,
      });

      if ("error" in addAuthenticatorResponse) {
        return handleErrorResponse({errorResponse: addAuthenticatorResponse, enableLogging: this.enableLogging});
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

      if (
        syncCredentials &&
        addAuthenticatorResponse.isVerified &&
        (addAuthenticatorResponse.accessToken || useCookies)
      ) {
        const rpId = optionsResponse.options.rp.id ?? window.location.hostname;

        void this.syncPasskeysWithCredentialManager({
          rpId,
          userHandle: optionsResponse.options.user.id,
          credentialId: registrationResponse.id,
          token: addAuthenticatorResponse.accessToken,
          useCookies,
        });
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
    const preferImmediatelyAvailableCredentials = Boolean(params?.preferImmediatelyAvailableCredentials);

    if (params?.token && params.autofill) {
      throw new Error("autofill is not supported when providing a token");
    }

    if (params?.action && params.token) {
      throw new Error("action is not supported when providing a token");
    }

    if (preferImmediatelyAvailableCredentials && params?.autofill) {
      throw new Error("autofill is not supported when using immediate UI mode");
    }

    const syncCredentials = params?.syncCredentials ?? true;

    if (preferImmediatelyAvailableCredentials && !(await this.doesBrowserSupportImmediateMediation())) {
      return this.handleClientErrorResponse(
        ErrorCode.immediate_mediation_not_supported,
        "Immediate UI mode is not supported by this browser."
      );
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

      return handleErrorResponse({errorResponse: challengeResponse, enableLogging: this.enableLogging});
    }

    const optionsResponse =
      params?.action || !params?.useCookies
        ? await this.api.authenticationOptions({
            token: params?.token,
            challengeId: challengeResponse?.challengeId,
            useCookies: params?.useCookies,
          })
        : await this.api.authenticationOptionsWeb({token: params?.token});

    if ("error" in optionsResponse) {
      autofillRequestPending = false;

      return handleErrorResponse({errorResponse: optionsResponse, enableLogging: this.enableLogging});
    }

    try {
      const authenticationResponse = preferImmediatelyAvailableCredentials
        ? await this.getImmediateMediationCredential(optionsResponse.options)
        : await startAuthentication({
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

        if (syncCredentials && verifyResponse.errorCode === ErrorCode.unknown_credential) {
          const rpId = this.getAuthOptionsRpId(optionsResponse.options);

          await signalUnknownCredential({rpId, credentialId: authenticationResponse.id}, this.enableLogging);

          this.removeCredentialFromLocalCache(authenticationResponse.id);
        }

        return handleErrorResponse({errorResponse: verifyResponse, enableLogging: this.enableLogging});
      }

      if (verifyResponse.isVerified) {
        this.storeCredentialAgainstDevice({...authenticationResponse, userId: verifyResponse.userId});
      }

      if (verifyResponse.accessToken) {
        this.cache.token = verifyResponse.accessToken;
      }

      const userHandle = authenticationResponse.response.userHandle;

      if (
        syncCredentials &&
        verifyResponse.isVerified &&
        (verifyResponse.accessToken || params?.useCookies) &&
        userHandle
      ) {
        const rpId = this.getAuthOptionsRpId(optionsResponse.options);

        void this.syncPasskeysWithCredentialManager({
          rpId,
          userHandle,
          credentialId: authenticationResponse.id,
          token: verifyResponse.accessToken,
          useCookies: params?.useCookies,
        });
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

      if (preferImmediatelyAvailableCredentials && isImmediateMediationCredentialNotFoundError(e)) {
        return this.handleClientErrorResponse(
          ErrorCode.credential_not_found,
          "No immediately available passkey credentials were found."
        );
      }

      const error = preferImmediatelyAvailableCredentials
        ? identifyImmediateMediationAuthenticationError({error: e, publicKey: optionsResponse.options})
        : e;

      handleWebAuthnError(error);

      throw error;
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
    const publicKeyCredential = window.PublicKeyCredential as
      | PublicKeyCredentialConstructorWithCapabilities
      | undefined;

    if (publicKeyCredential?.getClientCapabilities) {
      const capabilities = await publicKeyCredential.getClientCapabilities();
      if (capabilities.conditionalCreate) {
        return true;
      }
    }

    return false;
  }

  private async doesBrowserSupportImmediateMediation() {
    const publicKeyCredential = window.PublicKeyCredential as
      | PublicKeyCredentialConstructorWithCapabilities
      | undefined;

    if (!publicKeyCredential?.getClientCapabilities || !publicKeyCredential.parseRequestOptionsFromJSON) {
      return false;
    }

    try {
      const capabilities = await publicKeyCredential.getClientCapabilities();

      return Boolean(capabilities.immediateGet && navigator.credentials?.get);
    } catch {
      return false;
    }
  }

  private async getImmediateMediationCredential(
    optionsJSON: AuthenticationOptsResponse["options"]
  ): Promise<AuthenticationResponseJSON> {
    const publicKeyCredential = window.PublicKeyCredential as PublicKeyCredentialConstructorWithCapabilities;

    const publicKey = publicKeyCredential.parseRequestOptionsFromJSON?.({
      ...optionsJSON,
      allowCredentials: [],
    });

    if (!publicKey) {
      throw new Error("IMMEDIATE_MEDIATION_NOT_SUPPORTED");
    }

    const credential = (await navigator.credentials.get({
      publicKey,
      uiMode: "immediate",
    } as ImmediateCredentialRequestOptions)) as PublicKeyCredentialWithToJSON | null;

    if (!credential) {
      throw new DOMException("No immediately available credentials were found.", "NotAllowedError");
    }

    return credential.toJSON();
  }

  private handleClientErrorResponse(
    errorCode: ErrorCode,
    errorDescription: string
  ): AuthsignalResponse<SignInResponse> {
    return {
      error: errorDescription,
      errorCode,
      errorDescription,
    };
  }

  private getAuthOptionsRpId(options: unknown): string {
    const rpId = (options as {rpId?: string})?.rpId;
    return rpId ?? window.location.hostname;
  }

  private async syncPasskeysWithCredentialManager({
    rpId,
    userHandle,
    credentialId,
    token,
    useCookies,
  }: {
    rpId: string;
    userHandle: string;
    credentialId: string;
    token?: string;
    useCookies?: boolean;
  }) {
    try {
      const result = await this.api.getAuthenticators({token, useCookies});

      if (!Array.isArray(result)) {
        if (this.enableLogging) {
          console.warn("[Authsignal] Could not fetch authenticators for passkey sync", result);
        }
        return;
      }

      const credentialIds = result
        .filter(
          (a): a is Authenticator & {webauthnCredential: {credentialId: string}} =>
            a.verificationMethod === VerificationMethod.PASSKEY && Boolean(a.webauthnCredential?.credentialId)
        )
        .map((a) => a.webauthnCredential.credentialId);

      await signalAllAcceptedCredentials(
        {rpId, userId: userHandle, credentialIds: Array.from(new Set([...credentialIds, credentialId]))},
        this.enableLogging
      );
    } catch (e) {
      if (this.enableLogging) {
        console.warn("[Authsignal] Passkey sync failed", e);
      }
    }
  }

  private removeCredentialFromLocalCache(credentialId: string) {
    const storedCredentials = localStorage.getItem(this.passkeyLocalStorageKey);
    if (!storedCredentials) return;

    let credentialsMap: Record<string, string[]>;
    try {
      credentialsMap = JSON.parse(storedCredentials);
    } catch {
      return;
    }

    let changed = false;
    for (const userId of Object.keys(credentialsMap)) {
      const filtered = credentialsMap[userId].filter((id) => id !== credentialId);
      if (filtered.length !== credentialsMap[userId].length) {
        credentialsMap[userId] = filtered;
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(this.passkeyLocalStorageKey, JSON.stringify(credentialsMap));
    }
  }
}
