import {
  AuthenticationResponseJSON,
  AuthenticatorAttachment,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";

export type RegistrationOptsRequest = {
  userName?: string;
  token: string;
  authenticatorAttachment?: AuthenticatorAttachment | null;
};

export type RegistrationOptsResponse = {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export type AuthenticationOptsRequest = {
  token?: string;
};

export type AuthenticationOptsResponse = {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export type AddAuthenticatorRequest = {
  token: string;
  challengeId: string;
  registrationCredential: RegistrationResponseJSON;
};

export type AddAuthenticatorResponse = {
  isVerified: boolean;
  accessToken?: string;
  userAuthenticatorId?: string;
};

export type VerifyRequest = {
  token?: string;
  challengeId: string;
  authenticationCredential: AuthenticationResponseJSON;
};

export type VerifyResponse = {
  isVerified: boolean;
  accessToken?: string;
};

export type PasskeyAuthenticatorResponse = {
  credentialId: string;
  verifiedAt: string;
};
