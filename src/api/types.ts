import {
  AuthenticationResponseJSON,
  AuthenticatorAttachment,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";

export type RegistrationOptsRequest = {
  username?: string;
  authenticatorAttachment?: AuthenticatorAttachment | null;
};

export type RegistrationOptsResponse = {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export type AuthenticationOptsRequest = {
  challengeId?: string;
};

export type AuthenticationOptsResponse = {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export type AddAuthenticatorRequest = {
  challengeId: string;
  registrationCredential: RegistrationResponseJSON;
};

export type AddAuthenticatorResponse = {
  isVerified: boolean;
  accessToken?: string;
  userAuthenticatorId?: string;
};

export type VerifyRequest = {
  challengeId: string;
  authenticationCredential: AuthenticationResponseJSON;
  deviceId?: string;
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

export type AuthsignalResponse<T> = T | ErrorResponse;
