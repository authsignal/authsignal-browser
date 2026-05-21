type SignalAllAcceptedCredentialsParams = {
  rpId: string;
  userId: string;
  credentialIds: string[];
};

type SignalUnknownCredentialParams = {
  rpId: string;
  credentialId: string;
};

type SignalCapablePublicKeyCredential = {
  signalAllAcceptedCredentials?: (params: {
    rpId: string;
    userId: string;
    allAcceptedCredentialIds: string[];
  }) => Promise<void>;
  signalUnknownCredential?: (params: {rpId: string; credentialId: string}) => Promise<void>;
};

function getSignalApi(): SignalCapablePublicKeyCredential | null {
  if (typeof window === "undefined" || typeof window.PublicKeyCredential === "undefined") {
    return null;
  }

  return window.PublicKeyCredential as unknown as SignalCapablePublicKeyCredential;
}

export function isSignalAllAcceptedSupported(): boolean {
  const api = getSignalApi();
  return Boolean(api && typeof api.signalAllAcceptedCredentials === "function");
}

export function isSignalUnknownCredentialSupported(): boolean {
  const api = getSignalApi();
  return Boolean(api && typeof api.signalUnknownCredential === "function");
}

export async function signalAllAcceptedCredentials(
  {rpId, userId, credentialIds}: SignalAllAcceptedCredentialsParams,
  enableLogging: boolean
): Promise<void> {
  const api = getSignalApi();

  if (!api?.signalAllAcceptedCredentials) {
    return;
  }

  try {
    await api.signalAllAcceptedCredentials({
      rpId,
      userId,
      allAcceptedCredentialIds: credentialIds,
    });
  } catch (e) {
    if (enableLogging) {
      console.warn("[Authsignal] signalAllAcceptedCredentials failed", e);
    }
  }
}

export async function signalUnknownCredential(
  {rpId, credentialId}: SignalUnknownCredentialParams,
  enableLogging: boolean
): Promise<void> {
  const api = getSignalApi();

  if (!api?.signalUnknownCredential) {
    return;
  }

  try {
    await api.signalUnknownCredential({rpId, credentialId});
  } catch (e) {
    if (enableLogging) {
      console.warn("[Authsignal] signalUnknownCredential failed", e);
    }
  }
}
