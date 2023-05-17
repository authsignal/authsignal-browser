import { KyInstance } from "ky/distribution/types/ky";
import { AddAuthenticatorRequest, AddAuthenticatorResponse, AuthenticationOptsRequest, AuthenticationOptsResponse, RegistrationOptsRequest, RegistrationOptsResponse, VerifyRequest, VerifyResponse } from "./types";
declare type PasskeyApiClientOptions = {
    baseUrl: string;
    tenantId: string;
};
export declare class PasskeyApiClient {
    tenantId: string;
    api: KyInstance;
    constructor({ baseUrl, tenantId }: PasskeyApiClientOptions);
    registrationOptions({ token, userName }: RegistrationOptsRequest): Promise<RegistrationOptsResponse>;
    authenticationOptions({ token }: AuthenticationOptsRequest): Promise<AuthenticationOptsResponse>;
    addAuthenticator({ token, ...rest }: AddAuthenticatorRequest): Promise<AddAuthenticatorResponse>;
    verify({ token, ...rest }: VerifyRequest): Promise<VerifyResponse>;
}
export {};
