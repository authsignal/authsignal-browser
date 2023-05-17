declare type BaseLaunchOptions = {
    /**
     *  How the Authsignal Prebuilt MFA page should launch.
     *  `popup` will cause it to open in a overlay, whilst `redirect`
     *  will trigger a full page redirect.
     *  If no value is supplied, mode defaults to `redirect`.
     */
    mode?: "popup" | "redirect";
};
declare type RedirectLaunchOptions = BaseLaunchOptions & {
    mode: "redirect";
};
declare type PopupLaunchOptions = BaseLaunchOptions & {
    mode: "popup";
    popupOptions?: {
        /** Any valid CSS value for the `width` property. */
        width?: string;
        /**
         * @deprecated The popup will automatically resize to fit the content.
         */
        height?: string;
    };
};
export declare type LaunchOptions = RedirectLaunchOptions | PopupLaunchOptions;
export declare type AuthsignalOptions = {
    /**
     * Cookie domain that will be used to identify
     * users. If not set, location.hostname will be used
     */
    cookieDomain?: string;
    /**
     * Tracking host (where API calls will be sent). If not set,
     * we'd try to do the best to "guess" it. Last resort is t.authsignal.com.
     *
     * Though this parameter is not required, it's highly recommended to set is explicitly
     */
    trackingHost?: string;
    /**
     * Name of id cookie. `__as_aid` by default
     */
    cookieName?: string;
    baseUrl?: string;
    tenantId: string;
};
export declare enum AuthsignalWindowMessage {
    AUTHSIGNAL_CLOSE_POPUP = "AUTHSIGNAL_CLOSE_POPUP"
}
export declare type AuthsignalWindowMessageData = {
    event: AuthsignalWindowMessage;
    token: string;
};
export declare type TokenPayload = {
    token?: string;
};
export {};
