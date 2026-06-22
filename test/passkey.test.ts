import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

const webAuthnMocks = vi.hoisted(() => ({
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}));

vi.mock("@simplewebauthn/browser", () => ({
  startAuthentication: webAuthnMocks.startAuthentication,
  startRegistration: webAuthnMocks.startRegistration,
  WebAuthnError: class WebAuthnError extends Error {
    code?: string;

    constructor({message, code, cause, name}: {message: string; code: string; cause: Error; name?: string}) {
      super(message);
      this.name = name ?? cause.name;
      this.code = code;
    }
  },
}));

import {VerificationMethod} from "../src/api/types/shared";
import {Passkey} from "../src/passkey";
import {ErrorCode} from "../src/types";

const baseUrl = "https://api.example.com";

const authenticationResponse = {
  id: "current-credential-id",
  rawId: "current-credential-id",
  response: {
    userHandle: "user-handle",
    clientDataJSON: "client-data",
    authenticatorData: "authenticator-data",
    signature: "signature",
  },
  authenticatorAttachment: "platform",
  clientExtensionResults: {},
  type: "public-key",
};

function createPasskey({enableLogging = false}: {enableLogging?: boolean} = {}) {
  return new Passkey({
    baseUrl,
    tenantId: "tenant-id",
    anonymousId: "device-id",
    enableLogging,
  });
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    statusText: "OK",
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function authenticationOptionsResponse(options: Record<string, unknown> = {}) {
  return {
    challengeId: "challenge-id",
    options: {
      challenge: "challenge",
      rpId: "example.com",
      allowCredentials: [],
      ...options,
    },
  };
}

function passkeyAuthenticator(credentialId: string) {
  return {
    userAuthenticatorId: `authenticator-${credentialId}`,
    verificationMethod: VerificationMethod.PASSKEY,
    createdAt: "2026-05-19T00:00:00.000Z",
    webauthnCredential: {
      credentialId,
    },
  };
}

function setupFetch() {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function setupSignalApi() {
  const signalAllAcceptedCredentials = vi.fn().mockResolvedValue(undefined);
  const signalUnknownCredential = vi.fn().mockResolvedValue(undefined);

  Object.defineProperty(window, "PublicKeyCredential", {
    configurable: true,
    value: {
      signalAllAcceptedCredentials,
      signalUnknownCredential,
    },
  });

  return {signalAllAcceptedCredentials, signalUnknownCredential};
}

async function flushBackgroundSync() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("Passkey passkey sync", () => {
  const originalPublicKeyCredential = window.PublicKeyCredential;

  beforeEach(() => {
    webAuthnMocks.startAuthentication.mockReset();
    webAuthnMocks.startRegistration.mockReset();
    webAuthnMocks.startAuthentication.mockResolvedValue(authenticationResponse);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();

    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: originalPublicKeyCredential,
    });
  });

  it("includes the just-used credential when signaling accepted credentials", async () => {
    const fetchMock = setupFetch();
    const {signalAllAcceptedCredentials} = setupSignalApi();

    fetchMock
      .mockResolvedValueOnce(jsonResponse(authenticationOptionsResponse()))
      .mockResolvedValueOnce(jsonResponse({isVerified: true, accessToken: "access-token", userId: "user-id"}))
      .mockResolvedValueOnce(jsonResponse([passkeyAuthenticator("server-credential-id")]));

    await createPasskey().signIn();
    await flushBackgroundSync();

    expect(signalAllAcceptedCredentials).toHaveBeenCalledWith({
      rpId: "example.com",
      userId: "user-handle",
      allAcceptedCredentialIds: ["server-credential-id", "current-credential-id"],
    });
  });

  it("uses cookies when syncing after a cookie-backed sign-in", async () => {
    const fetchMock = setupFetch();
    const {signalAllAcceptedCredentials} = setupSignalApi();

    fetchMock
      .mockResolvedValueOnce(jsonResponse(authenticationOptionsResponse()))
      .mockResolvedValueOnce(jsonResponse({isVerified: true, userId: "user-id"}))
      .mockResolvedValueOnce(jsonResponse([passkeyAuthenticator("current-credential-id")]));

    await createPasskey().signIn({useCookies: true});
    await flushBackgroundSync();

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `${baseUrl}/client/user-authenticators`,
      expect.objectContaining({credentials: "include"})
    );
    expect(signalAllAcceptedCredentials).toHaveBeenCalledWith({
      rpId: "example.com",
      userId: "user-handle",
      allAcceptedCredentialIds: ["current-credential-id"],
    });
  });

  it("does not signal an unknown credential for a generic invalid credential error", async () => {
    const fetchMock = setupFetch();
    const {signalUnknownCredential} = setupSignalApi();

    fetchMock.mockResolvedValueOnce(jsonResponse(authenticationOptionsResponse())).mockResolvedValueOnce(
      jsonResponse({
        error: "Invalid credential",
        errorCode: ErrorCode.invalid_credential,
      })
    );

    const result = await createPasskey().signIn();

    expect(result.errorCode).toBe(ErrorCode.invalid_credential);
    expect(signalUnknownCredential).not.toHaveBeenCalled();
  });

  it("signals an unknown credential for a specific unknown credential error", async () => {
    const fetchMock = setupFetch();
    const {signalUnknownCredential} = setupSignalApi();

    fetchMock.mockResolvedValueOnce(jsonResponse(authenticationOptionsResponse())).mockResolvedValueOnce(
      jsonResponse({
        error: "Unknown credential",
        errorCode: ErrorCode.unknown_credential,
      })
    );

    const result = await createPasskey().signIn();

    expect(result.errorCode).toBe(ErrorCode.unknown_credential);
    expect(signalUnknownCredential).toHaveBeenCalledWith({
      rpId: "example.com",
      credentialId: "current-credential-id",
    });
  });

  it("contains background sync failures after the SDK response is returned", async () => {
    const fetchMock = setupFetch();
    setupSignalApi();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    fetchMock
      .mockResolvedValueOnce(jsonResponse(authenticationOptionsResponse()))
      .mockResolvedValueOnce(jsonResponse({isVerified: true, accessToken: "access-token", userId: "user-id"}))
      .mockRejectedValueOnce(new Error("Network failed"));

    const result = await createPasskey({enableLogging: true}).signIn();
    await flushBackgroundSync();

    expect(result.data?.isVerified).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith("[Authsignal] Passkey sync failed", expect.any(Error));
  });
});

function setupImmediateApi({immediateGet = true}: {immediateGet?: boolean} = {}) {
  const getClientCapabilities = vi.fn().mockResolvedValue({immediateGet});
  const parseRequestOptionsFromJSON = vi.fn((options: unknown) => options);

  Object.defineProperty(window, "PublicKeyCredential", {
    configurable: true,
    value: {
      getClientCapabilities,
      parseRequestOptionsFromJSON,
      signalAllAcceptedCredentials: vi.fn().mockResolvedValue(undefined),
      signalUnknownCredential: vi.fn().mockResolvedValue(undefined),
    },
  });

  const credentialsGet = vi.fn();
  Object.defineProperty(navigator, "credentials", {
    configurable: true,
    value: {get: credentialsGet},
  });

  return {getClientCapabilities, parseRequestOptionsFromJSON, credentialsGet};
}

describe("Passkey immediate UI mode", () => {
  const originalPublicKeyCredential = window.PublicKeyCredential;
  const originalNavigatorCredentials = navigator.credentials;

  beforeEach(() => {
    webAuthnMocks.startAuthentication.mockReset();
    webAuthnMocks.startRegistration.mockReset();
    webAuthnMocks.startAuthentication.mockResolvedValue(authenticationResponse);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();

    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: originalPublicKeyCredential,
    });
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: originalNavigatorCredentials,
    });
  });

  it("signs in using immediate UI mode when a credential is available", async () => {
    const fetchMock = setupFetch();
    const {parseRequestOptionsFromJSON, credentialsGet} = setupImmediateApi();
    const optionsResponse = authenticationOptionsResponse({
      allowCredentials: [{id: "known-credential-id", type: "public-key"}],
    });
    credentialsGet.mockResolvedValue({toJSON: () => authenticationResponse});

    fetchMock
      .mockResolvedValueOnce(jsonResponse(optionsResponse))
      .mockResolvedValueOnce(jsonResponse({isVerified: true, accessToken: "access-token", userId: "user-id"}));

    const result = await createPasskey().signIn({
      preferImmediatelyAvailableCredentials: true,
      syncCredentials: false,
    });

    expect(result.data?.isVerified).toBe(true);
    expect(result.data?.token).toBe("access-token");
    expect(webAuthnMocks.startAuthentication).not.toHaveBeenCalled();
    expect(parseRequestOptionsFromJSON).toHaveBeenCalledWith({...optionsResponse.options, allowCredentials: []});
    expect(credentialsGet).toHaveBeenCalledWith(expect.objectContaining({uiMode: "immediate"}));
    expect(credentialsGet.mock.calls[0][0]).not.toHaveProperty("mediation");
  });

  it("returns credential_not_found when no credential is immediately available", async () => {
    const fetchMock = setupFetch();
    const {credentialsGet} = setupImmediateApi();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    credentialsGet.mockRejectedValue(new DOMException("No credentials", "NotAllowedError"));

    fetchMock.mockResolvedValueOnce(jsonResponse(authenticationOptionsResponse()));

    const result = await createPasskey({enableLogging: true}).signIn({
      preferImmediatelyAvailableCredentials: true,
    });

    expect(result.errorCode).toBe(ErrorCode.credential_not_found);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws a WebAuthnError for immediate UI mode security errors", async () => {
    const fetchMock = setupFetch();
    const {credentialsGet} = setupImmediateApi();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    credentialsGet.mockRejectedValue(new DOMException("Invalid RP ID", "SecurityError"));

    fetchMock.mockResolvedValueOnce(jsonResponse(authenticationOptionsResponse({rpId: "example.com"})));

    await expect(
      createPasskey().signIn({
        preferImmediatelyAvailableCredentials: true,
      })
    ).rejects.toMatchObject({
      code: "ERROR_INVALID_RP_ID",
      message: 'The RP ID "example.com" is invalid for this domain',
      name: "SecurityError",
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('The Relying Party ID "example.com" is invalid for this domain.')
    );
  });

  it("throws a WebAuthnError for immediate UI mode unknown errors", async () => {
    const fetchMock = setupFetch();
    const {credentialsGet} = setupImmediateApi();
    credentialsGet.mockRejectedValue(new DOMException("Unknown", "UnknownError"));

    fetchMock.mockResolvedValueOnce(jsonResponse(authenticationOptionsResponse()));

    await expect(
      createPasskey().signIn({
        preferImmediatelyAvailableCredentials: true,
      })
    ).rejects.toMatchObject({
      code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
      message:
        "The authenticator was unable to process the specified options, or could not create a new assertion signature",
      name: "UnknownError",
    });
  });

  it("returns immediate_mediation_not_supported when the browser lacks the capability", async () => {
    const fetchMock = setupFetch();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    setupImmediateApi({immediateGet: false});

    const result = await createPasskey({enableLogging: true}).signIn({
      preferImmediatelyAvailableCredentials: true,
    });

    expect(result.errorCode).toBe(ErrorCode.immediate_mediation_not_supported);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns immediate_mediation_not_supported when request option parsing is unavailable", async () => {
    const fetchMock = setupFetch();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: {
        getClientCapabilities: vi.fn().mockResolvedValue({immediateGet: true}),
      },
    });

    const result = await createPasskey({enableLogging: true}).signIn({
      preferImmediatelyAvailableCredentials: true,
    });

    expect(result.errorCode).toBe(ErrorCode.immediate_mediation_not_supported);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns immediate_mediation_not_supported when capability detection fails", async () => {
    const fetchMock = setupFetch();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: {
        getClientCapabilities: vi.fn().mockRejectedValue(new Error("Detection failed")),
        parseRequestOptionsFromJSON: vi.fn(),
      },
    });
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: {get: vi.fn()},
    });

    const result = await createPasskey({enableLogging: true}).signIn({
      preferImmediatelyAvailableCredentials: true,
    });

    expect(result.errorCode).toBe(ErrorCode.immediate_mediation_not_supported);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when immediate UI mode is combined with autofill", async () => {
    setupImmediateApi();

    await expect(createPasskey().signIn({preferImmediatelyAvailableCredentials: true, autofill: true})).rejects.toThrow(
      "autofill is not supported when using immediate UI mode"
    );
  });
});
