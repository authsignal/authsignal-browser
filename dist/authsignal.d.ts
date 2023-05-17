import { AuthsignalOptions, LaunchOptions, TokenPayload } from "./types";
import { Passkey } from "./passkey";
export declare class Authsignal {
    anonymousId: string;
    cookieDomain: string;
    anonymousIdCookieName: string;
    passkey: Passkey;
    private _token;
    constructor({ cookieDomain, cookieName, baseUrl, tenantId, }: AuthsignalOptions);
    launch(url: string, options?: {
        mode?: "redirect";
    } & LaunchOptions): undefined;
    launch(url: string, options?: {
        mode: "popup";
    } & LaunchOptions): Promise<TokenPayload>;
}
