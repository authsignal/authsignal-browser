import {
  AuthenticationResponseJSON,
  AuthenticatorAttachment,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

// Display-only card label + icon shown in the SPC dialog. `displayName` and `icon` are optional
// because either may already be persisted against the credential (returned in the auth options).
export type SpcInstrument = {
  displayName?: string;
  icon?: string;
};

// Per-transaction payment data, supplied by the caller (merchant/ACS). Never sourced from Authsignal.
export type SpcPayment = {
  payeeName?: string;
  payeeOrigin?: string;
  amount: string; // decimal string, e.g. "42.00"
  currency: string; // ISO-4217, e.g. "USD"
  instrument?: SpcInstrument;
};

// The data the SPC ceremony needs, independent of how it was obtained. In a 3DS flow the ACS
// delivers this in ARes #1; in a first-party flow `signInWithPaymentConfirmation` derives it from
// the authentication-options response.
export type SpcRequestData = {
  rpId: string;
  challenge: string; // base64url
  credentialIds: string[]; // base64url
  instrument?: SpcInstrument; // persisted instrument from the credential, if any
};

// Feature-detect SPC (Chromium on macOS/Windows/Android). False on Safari/Firefox.
export async function isPaymentConfirmationAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !("PaymentRequest" in window)) {
    return false;
  }
  try {
    const request = new PaymentRequest(
      [
        {
          supportedMethods: "secure-payment-confirmation",
          data: {
            rpId: "rp.example",
            credentialIds: [new Uint8Array(1)],
            challenge: new Uint8Array(1),
            instrument: {displayName: "x", icon: "https://rp.example/x.png"},
            payeeName: "x",
          },
        },
      ],
      {total: {label: "x", amount: {currency: "USD", value: "0"}}}
    );
    return await request.canMakePayment();
  } catch {
    return false;
  }
}

// Run just the SPC ceremony: build the PaymentRequest, show the native dialog, and return the
// resulting `payment.get` assertion normalised to AuthenticationResponseJSON. Does not fall back —
// it throws if SPC is unavailable or no credential is provided, so the caller owns the ladder.
export async function runPaymentConfirmation(
  request: SpcRequestData,
  payment: SpcPayment
): Promise<AuthenticationResponseJSON> {
  if (request.credentialIds.length === 0) {
    throw new Error("Secure Payment Confirmation requires at least one credential id");
  }

  const instrument = {
    displayName: payment.instrument?.displayName ?? request.instrument?.displayName,
    icon: payment.instrument?.icon ?? request.instrument?.icon,
  };

  const paymentRequest = new PaymentRequest(
    [
      {
        supportedMethods: "secure-payment-confirmation",
        data: {
          rpId: request.rpId,
          challenge: base64UrlToBuffer(request.challenge),
          credentialIds: request.credentialIds.map(base64UrlToBuffer),
          instrument,
          payeeName: payment.payeeName,
          payeeOrigin: payment.payeeOrigin,
          timeout: 60000,
        },
      },
    ],
    {total: {label: "Total", amount: {currency: payment.currency, value: payment.amount}}}
  );

  const response = await paymentRequest.show();
  const credential = response.details as PublicKeyCredential;
  await response.complete("success");

  return normaliseAssertion(credential);
}

// Build SpcRequestData from the authentication-options response (the first-party path).
export function toSpcRequestData(
  options: PublicKeyCredentialRequestOptionsJSON,
  paymentInstruments?: {credentialId: string; displayName: string}[]
): SpcRequestData {
  const rpId = (options as {rpId?: string}).rpId ?? window.location.hostname;
  const allowCredentials = (options.allowCredentials ?? []) as {id: string}[];
  const persisted = paymentInstruments && paymentInstruments.length > 0 ? paymentInstruments[0] : undefined;

  return {
    rpId,
    challenge: options.challenge,
    credentialIds: allowCredentials.map((credential) => credential.id),
    instrument: persisted ? {displayName: persisted.displayName} : undefined,
  };
}

// The PaymentRequest result is a PublicKeyCredential with payment.get clientData. Modern Chromium
// supports credential.toJSON(); fall back to manual encoding otherwise.
function normaliseAssertion(credential: PublicKeyCredential): AuthenticationResponseJSON {
  const withToJSON = credential as PublicKeyCredential & {toJSON?: () => AuthenticationResponseJSON};
  if (typeof withToJSON.toJSON === "function") {
    return withToJSON.toJSON();
  }

  const assertion = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: "public-key",
    clientExtensionResults: credential.getClientExtensionResults(),
    authenticatorAttachment:
      (credential as {authenticatorAttachment?: AuthenticatorAttachment}).authenticatorAttachment ?? undefined,
    response: {
      clientDataJSON: bufferToBase64Url(assertion.clientDataJSON),
      authenticatorData: bufferToBase64Url(assertion.authenticatorData),
      signature: bufferToBase64Url(assertion.signature),
      userHandle: assertion.userHandle ? bufferToBase64Url(assertion.userHandle) : undefined,
    },
  };
}

function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
