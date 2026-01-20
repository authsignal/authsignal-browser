import {WebAuthnError} from "@simplewebauthn/browser";
import {VerifyResponse as ApiVerifyResponse} from "./api/types/shared";
type BaseLaunchOptions = {
  /**
   *  How the Authsignal Prebuilt MFA page should launch.
   *  `popup` will cause it to open in a overlay, whilst `redirect`
   *  will trigger a full page redirect.
   *  If no value is supplied, mode defaults to `redirect`.
   */
  mode?: "popup" | "redirect" | "window";
};

export type RedirectLaunchOptions = BaseLaunchOptions & {
  mode: "redirect";
};

export type PopupLaunchOptions = BaseLaunchOptions & {
  mode: "popup";
  popupOptions?: {
    /** Any valid CSS value for the `width` property. */
    width?: string;
    /**
     * Set the height of the popup. If not set, the popup will automatically resize to fit the content.
     */
    height?: string;
    /**
     * Whether the popup is closable with the escape key and by clicking the backdrop.
     */
    isClosable?: boolean;
  };
};

export type WindowLaunchOptions = BaseLaunchOptions & {
  mode: "window";
  windowOptions?: {
    width?: number;
    height?: number;
  };
};

export type LaunchOptions = RedirectLaunchOptions | PopupLaunchOptions | WindowLaunchOptions;

export type AuthsignalOptions = {
  /**
   * Cookie domain that will be used to identify
   * users. If not set, location.hostname will be used
   */
  cookieDomain?: string;
  /**
   * @deprecated - This parameter is no longer used.
   */
  trackingHost?: string;

  /**
   * Name of id cookie. `__as_aid` by default
   */
  cookieName?: string;
  baseUrl?: string;
  tenantId: string;
  onTokenExpired?: () => void;

  enableLogging?: boolean;
};

export enum AuthsignalWindowMessage {
  AUTHSIGNAL_CLOSE_POPUP = "AUTHSIGNAL_CLOSE_POPUP",
}

export type AuthsignalWindowMessageData = {
  event: AuthsignalWindowMessage;
  token: string;
};

export type TokenPayload = {
  token?: string;
};

export enum ErrorCode {
  token_not_set = "token_not_set",
  expired_token = "expired_token",
  network_error = "network_error",
  too_many_requests = "too_many_requests",
}

export type AuthsignalResponse<T> = {
  data?: T;
  // eslint-disable-next-line @typescript-eslint/ban-types -- This is a valid use case for an empty object
  errorCode?: ErrorCode | (string & {});
  errorDescription?: string;
  /**
   * @deprecated Use errorCode and errorDescription instead
   */
  error?: string;
};

export type VerifyResponse = Omit<ApiVerifyResponse, "accessToken"> & {
  token?: string;
};

export {WebAuthnError};
