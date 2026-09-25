import {WebAuthnAbortService, WebAuthnError} from "@simplewebauthn/browser";

// Browsers only allow one WebAuthn request at a time. A user-initiated ceremony (e.g. a sign-in button)
// cancels any pending autofill request, and the autofill request is restarted if that ceremony doesn't succeed.

// Incremented whenever a ceremony is requested or cancelled, so that a request which is still fetching
// options can tell it has been superseded before it starts a WebAuthn ceremony.
let latestCeremonyId = 0;

// Settles with whether the in-progress user-initiated ceremony succeeded.
let activeUserCeremony: Promise<boolean> | null = null;

let cancellationCount = 0;

export function startCeremony() {
  return ++latestCeremonyId;
}

export function throwIfCeremonySuperseded(ceremonyId: number) {
  if (ceremonyId !== latestCeremonyId) {
    const cause = new Error("WebAuthn ceremony was cancelled before it started");
    cause.name = "AbortError";

    throw new WebAuthnError({message: cause.message, code: "ERROR_CEREMONY_ABORTED", cause});
  }
}

export function isCeremonyAbortedError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || (error as {code?: string}).code === "ERROR_CEREMONY_ABORTED")
  );
}

export async function runUserCeremony<T>(
  ceremony: (ceremonyId: number) => Promise<T>,
  isSuccessful: (result: T) => boolean
): Promise<T> {
  const ceremonyId = startCeremony();

  let settle: (succeeded: boolean) => void = () => undefined;
  const userCeremony = new Promise<boolean>((resolve) => (settle = resolve));

  activeUserCeremony = userCeremony;

  let succeeded = false;

  try {
    const result = await ceremony(ceremonyId);

    succeeded = isSuccessful(result);

    return result;
  } finally {
    settle(succeeded);

    if (activeUserCeremony === userCeremony) {
      activeUserCeremony = null;
    }
  }
}

/**
 * Waits until no user-initiated ceremony is in progress.
 * Resolves with whether the last one succeeded, or undefined if none was in progress.
 */
export async function waitForUserCeremonies(): Promise<boolean | undefined> {
  let succeeded: boolean | undefined;

  while (activeUserCeremony) {
    succeeded = await activeUserCeremony;
  }

  return succeeded;
}

export function isUserCeremonyInProgress() {
  return activeUserCeremony !== null;
}

export function cancelCeremonies() {
  cancellationCount++;
  latestCeremonyId++;

  WebAuthnAbortService.cancelCeremony();
}

export function getCancellationCount() {
  return cancellationCount;
}
