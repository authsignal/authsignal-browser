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
};

export type RegistrationOptsResponse = {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export type AuthenticationOptsResponse = {
  options: PublicKeyCredentialCreationOptionsJSON;
};

export type AddAuthenticatorRequest = {
  registrationCredential: RegistrationResponseJSON;
  conditionalCreate?: boolean;
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
  cookies?: boolean;
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

export type ChallengeResponse = {
  challengeId: string;
};

export type ErrorResponse = {
  error: string;
  errorDescription?: string;
};
