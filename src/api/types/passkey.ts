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
};

export type RegistrationOptsResponse = {
  challengeId?: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export type AuthenticationOptsRequest = {
  challengeId?: string;
  useCookies?: boolean;
};

export type AuthenticationOptsResponse = {
  options: PublicKeyCredentialRequestOptionsJSON;
  challengeId?: string;
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

// SPC SPIKE: per-transaction payment data returned alongside the challenge when the
// action has Secure Payment Confirmation enabled. Display-only `instrument` — never a PAN.
export type SpcChallengeData = {
  payeeName?: string;
  payeeOrigin?: string;
  amount: string; // decimal string, e.g. "42.00"
  currency: string; // ISO-4217, e.g. "USD"
  instrument: {displayName: string; icon: string};
  credentialIds: string[];
};

export type ChallengeResponse = {
  challengeId: string;
  spc?: SpcChallengeData; // SPC SPIKE
};

export type ErrorResponse = {
  error: string;
  errorCode?: ErrorCode;
  errorDescription?: string;
};
