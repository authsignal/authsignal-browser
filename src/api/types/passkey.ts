import {
  AuthenticationResponseJSON,
  AuthenticatorAttachment,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import {Authenticator} from "./shared";

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
  options: PublicKeyCredentialCreationOptionsJSON;
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
  errorDescription?: string;
};
