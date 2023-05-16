import {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/typescript-types";

export type RegistrationOptsRequest = {
  userName?: string;
  token: string;
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
