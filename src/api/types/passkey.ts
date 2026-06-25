import {
  AuthenticationResponseJSON,
  AuthenticatorAttachment,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import {Authenticator} from "./shared";
import {ErrorCode} from "../../types";

export type RegistrationOptsRequest = {
  username?: string;
  authenticatorAttachment?: AuthenticatorAttachment | null;
  useCookies?: boolean;
  // Mint a payment-capable (SPC) passkey; the server forces a platform authenticator + required UV
  // and injects the WebAuthn payment extension.
  securePaymentConfirmation?: boolean;
  // Instrument display label to persist against the credential (e.g. "Visa ••1234").
  instrumentDisplayName?: string;
};

export type RegistrationOptsResponse = {
  challengeId?: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export type AuthenticationOptsRequest = {
  challengeId?: string;
  useCookies?: boolean;
  // Signal an upcoming SPC ceremony: the response then offers only payment-capable credentials and
  // includes the server-set payment.
  securePaymentConfirmation?: boolean;
};

export type AuthenticationOptsResponse = {
  options: PublicKeyCredentialRequestOptionsJSON;
  challengeId?: string;
  // Instrument label(s) persisted against the user's payment-capable credentials, for SPC.
  paymentInstruments?: {credentialId: string; displayName: string}[];
  // The transaction set server-side on the action (via track custom data), for the SPC ceremony.
  payment?: {amount?: string; currency?: string; payeeName?: string; payeeOrigin?: string};
};

export type AddAuthenticatorRequest = {
  registrationCredential: RegistrationResponseJSON;
  conditionalCreate?: boolean;
  challengeId?: string;
  useCookies?: boolean;
};

export type AddAuthenticatorResponse = {
  isVerified: boolean;
  accessToken?: string;
  userAuthenticatorId?: string;
  userId?: string;
  userAuthenticator?: Authenticator;
};

export type VerifyRequest = {
  authenticationCredential: AuthenticationResponseJSON;
  deviceId?: string;
  challengeId?: string;
  useCookies?: boolean;
};

export type VerifyResponse = {
  isVerified: boolean;
  accessToken?: string;
  userId?: string;
  userAuthenticatorId?: string;
  username?: string;
  userDisplayName?: string;
};

export type PasskeyAuthenticatorResponse = {
  credentialId: string;
  verifiedAt: string;
};

export type ChallengeRequest = {
  action?: string;
  useCookies?: boolean;
};

export type ChallengeResponse = {
  challengeId: string;
};

export type ErrorResponse = {
  error: string;
  errorCode?: ErrorCode;
  errorDescription?: string;
};
