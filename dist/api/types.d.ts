import { AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from "@simplewebauthn/typescript-types";
export declare type RegistrationOptsRequest = {
    userName?: string;
    token: string;
};
export declare type RegistrationOptsResponse = {
    challengeId: string;
    options: PublicKeyCredentialCreationOptionsJSON;
};
export declare type AuthenticationOptsRequest = {
    token?: string;
};
export declare type AuthenticationOptsResponse = {
    challengeId: string;
    options: PublicKeyCredentialCreationOptionsJSON;
};
export declare type AddAuthenticatorRequest = {
    token: string;
    challengeId: string;
    registrationCredential: RegistrationResponseJSON;
};
export declare type AddAuthenticatorResponse = {
    isVerified: boolean;
    accessToken?: string;
    userAuthenticatorId?: string;
};
export declare type VerifyRequest = {
    token?: string;
    challengeId: string;
    authenticationCredential: AuthenticationResponseJSON;
};
export declare type VerifyResponse = {
    isVerified: boolean;
    accessToken?: string;
};
