import {v4 as uuidv4} from "uuid";

import {setCookie, getCookieDomain, getCookie} from "./helpers";
import {
  AuthsignalOptions,
  AuthsignalWindowMessage,
  AuthsignalWindowMessageData,
  LaunchOptions,
  PopupLaunchOptions,
  TokenPayload,
  WindowLaunchOptions,
} from "./types";
import {Passkey} from "./passkey";
import {PopupHandler, WindowHandler} from "./handlers";
import {Totp} from "./totp";
import {TokenCache} from "./token-cache";
import {Email} from "./email";
import {Sms} from "./sms";
import {EmailMagicLink} from "./email-magic-link";
import {SecurityKey} from "./security-key";
import {QrCode} from "./qr-code";
import {Push} from "./push";
import {Whatsapp} from "./whatsapp";

const DEFAULT_COOKIE_NAME = "__as_aid";
const DEFAULT_PROFILING_COOKIE_NAME = "__as_pid";

const DEFAULT_BASE_URL = "https://api.authsignal.com/v1";

const TMX_ORG_ID = "4a08uqve";

/**
 * Main Authsignal SDK client for browser applications.
 *
 * This is the primary entry point for integrating Authsignal's multi-factor authentication
 * and passwordless authentication into your web application. It provides access to various
 * authentication methods including passkeys, TOTP, SMS, email, push notifications, and more.
 *
 * @example
 * ```typescript
 * import { Authsignal } from '@authsignal/browser';
 *
 * const authsignal = new Authsignal({
 *   tenantId: 'your-tenant-id',
 *   baseUrl: 'https://api.authsignal.com/v1'
 * });
 *
 * await authsignal.passkey.signUp({ email: 'user@example.com' });
 * await authsignal.sms.enroll({ token: 'user-token', phoneNumber: '+1234567890' });
 * ```
 */
export class Authsignal {
  anonymousId = "";
  profilingId = "";
  cookieDomain = "";
  anonymousIdCookieName = "";

  passkey: Passkey;
  totp: Totp;
  email: Email;
  emailML: EmailMagicLink;
  sms: Sms;
  securityKey: SecurityKey;
  qrCode: QrCode;
  push: Push;
  whatsapp: Whatsapp;

  /**
   * Creates a new Authsignal SDK instance.
   *
   * @param tenantId - Your Authsignal tenant id (required)
   * @param baseUrl - The base URL for Authsignal API calls (defaults to 'https://api.authsignal.com/v1')
   * @param cookieDomain - Cookie domain for user identification (defaults to current hostname)
   * @param cookieName - Name of the anonymous ID cookie (defaults to '__as_aid')
   * @param onTokenExpired - Callback function called when authentication tokens expire
   *
   * @throws {Error} When tenantId is not provided
   *
   * @example
   * ```typescript
   * const authsignal = new Authsignal({
   *   tenantId: 'your-tenant-id',
   *   baseUrl: 'https://api.authsignal.com/v1',
   *   onTokenExpired: () => {
   *     window.location.href = '/login';
   *   }
   * });
   * ```
   */
  constructor({
    cookieDomain,
    cookieName = DEFAULT_COOKIE_NAME,
    baseUrl = DEFAULT_BASE_URL,
    tenantId,
    onTokenExpired,
  }: AuthsignalOptions) {
    this.cookieDomain = cookieDomain || getCookieDomain();
    this.anonymousIdCookieName = cookieName;

    if (!tenantId) {
      throw new Error("tenantId is required");
    }

    const idCookie = getCookie(this.anonymousIdCookieName);

    if (idCookie) {
      this.anonymousId = idCookie;
    } else {
      this.anonymousId = uuidv4();

      setCookie({
        name: this.anonymousIdCookieName,
        value: this.anonymousId,
        expire: Infinity,
        domain: this.cookieDomain,
        secure: document.location.protocol !== "http:",
      });
    }

    this.passkey = new Passkey({tenantId, baseUrl, anonymousId: this.anonymousId, onTokenExpired});
    this.totp = new Totp({tenantId, baseUrl, onTokenExpired});
    this.email = new Email({tenantId, baseUrl, onTokenExpired});
    this.emailML = new EmailMagicLink({tenantId, baseUrl, onTokenExpired});
    this.sms = new Sms({tenantId, baseUrl, onTokenExpired});
    this.securityKey = new SecurityKey({tenantId, baseUrl, onTokenExpired});
    this.qrCode = new QrCode({tenantId, baseUrl});
    this.push = new Push({tenantId, baseUrl});
    this.whatsapp = new Whatsapp({tenantId, baseUrl, onTokenExpired});
  }

  /**
   * Sets the authentication token for API requests.
   *
   * This token is typically obtained after successful authentication and is used
   * for subsequent API calls that require user authentication.
   *
   * @param token - The authentication token to store
   *
   * @example
   * ```typescript
   * const loginResult = await authsignal.launch('https://your-app.authsignal.com/login');
   * if (loginResult.token) {
   *   authsignal.setToken(loginResult.token);
   * }
   * ```
   */
  setToken(token: string) {
    TokenCache.shared.token = token;
  }

  /**
   * Launches the Authsignal prebuilt UI for authentication flows.
   *
   * This method opens the Authsignal challenge UI in different modes to handle various
   * authentication scenarios like login, signup, or step-up authentication.
   *
   * @param url - The Authsignal challenge URL to launch
   * @param options - Configuration for how the UI should be displayed
   * @param options.mode - Display mode: 'redirect' (default), 'popup', or 'window'
   * @param options.popupOptions - Configuration for popup mode (width, height, closable)
   * @param options.windowOptions - Configuration for window mode (width, height)
   *
   * @returns
   * - `undefined` for redirect mode (page redirects)
   * - `Promise<TokenPayload>` for popup/window modes (resolves with token when complete)
   *
   * @example
   * ```typescript
   * authsignal.launch('https://your-app.authsignal.com/login');
   *
   * const result = await authsignal.launch('https://your-app.authsignal.com/login', {
   *   mode: 'popup',
   *   popupOptions: { width: '400px', isClosable: true }
   * });
   * if (result.token) {
   *   authsignal.setToken(result.token);
   * }
   *
   * const windowResult = await authsignal.launch('https://your-app.authsignal.com/mfa', {
   *   mode: 'window',
   *   windowOptions: { width: 500, height: 600 }
   * });
   * ```
   */
  launch(url: string, options?: {mode?: "redirect"} & LaunchOptions): undefined;
  launch(url: string, options?: {mode: "popup"} & LaunchOptions): Promise<TokenPayload>;
  launch(url: string, options?: {mode: "window"} & LaunchOptions): Promise<TokenPayload>;
  launch(url: string, options?: LaunchOptions) {
    switch (options?.mode) {
      case "window":
        return this.launchWithWindow(url, options);
      case "popup":
        return this.launchWithPopup(url, options);
      case "redirect":
      default:
        this.launchWithRedirect(url);
    }
  }

  /**
   * Initializes advanced device profiling for fraud detection.
   *
   * This method sets up ThreatMetrix-based device fingerprinting to help detect
   * fraudulent behavior and improve security decisions. Call this method early
   * in your application lifecycle for optimal profiling data collection.
   *
   * @param baseUrl - Custom base URL for the profiling service (optional)
   *
   * @example
   * ```typescript
   * const authsignal = new Authsignal({ tenantId: 'your-tenant-id' });
   *
   * authsignal.initAdvancedProfiling();
   * authsignal.initAdvancedProfiling('https://custom-profiling.example.com');
   * ```
   */
  initAdvancedProfiling(baseUrl?: string) {
    const profilingId = uuidv4();

    this.profilingId = profilingId;

    setCookie({
      name: DEFAULT_PROFILING_COOKIE_NAME,
      value: profilingId,
      expire: Infinity,
      domain: this.cookieDomain,
      secure: document.location.protocol !== "http:",
    });

    const tmxProfilingScriptUrl = baseUrl
      ? `${baseUrl}/fp/tags.js?org_id=${TMX_ORG_ID}&session_id=${profilingId}`
      : `https://h.online-metrix.net/fp/tags.js?org_id=${TMX_ORG_ID}&session_id=${profilingId}`;
    const script = document.createElement("script");
    script.src = tmxProfilingScriptUrl;
    script.async = false;
    script.id = "as_adv_profile";
    document.head.appendChild(script);

    const pixelContainer = document.createElement("noscript");
    pixelContainer.setAttribute("id", "as_adv_profile_pixel");
    pixelContainer.setAttribute("aria-hidden", "true");

    // Instantiate Pixel
    const iframe = document.createElement("iframe");
    const profilingPixelUrl = baseUrl
      ? `${baseUrl}/fp/tags?org_id=${TMX_ORG_ID}&session_id=${profilingId}`
      : `https://h.online-metrix.net/fp/tags?org_id=${TMX_ORG_ID}&session_id=${profilingId}`;

    iframe.setAttribute("id", "as_adv_profile_pixel");
    iframe.setAttribute("src", profilingPixelUrl);
    iframe.setAttribute("style", "width: 100px; height: 100px; border: 0; position: absolute; top: -5000px;");

    if (pixelContainer) {
      pixelContainer.appendChild(iframe);
      document.body.prepend(pixelContainer);
    }
  }

  private launchWithRedirect(url: string) {
    window.location.href = url;
  }

  private launchWithPopup(url: string, options: PopupLaunchOptions) {
    const {popupOptions} = options;

    const popupHandler = new PopupHandler({width: popupOptions?.width, isClosable: popupOptions?.isClosable});

    const popupUrl = `${url}&mode=popup`;

    popupHandler.show({url: popupUrl});

    return new Promise<TokenPayload>((resolve) => {
      let token: string | undefined = undefined;

      const onMessage = (event: MessageEvent) => {
        let data: AuthsignalWindowMessageData | null = null;

        try {
          data = JSON.parse(event.data) as AuthsignalWindowMessageData;
        } catch {
          // Ignore if the event data is not valid JSON
        }

        if (data?.event === AuthsignalWindowMessage.AUTHSIGNAL_CLOSE_POPUP) {
          token = data.token;

          popupHandler.close();
        }
      };

      popupHandler.on("hide", () => {
        resolve({token});
      });

      window.addEventListener("message", onMessage, false);
    });
  }

  private launchWithWindow(url: string, options: WindowLaunchOptions) {
    const {windowOptions} = options;

    const windowHandler = new WindowHandler();

    const windowUrl = `${url}&mode=popup`;

    windowHandler.show({url: windowUrl, width: windowOptions?.width, height: windowOptions?.height});

    return new Promise<TokenPayload>((resolve) => {
      const onMessage = (event: MessageEvent) => {
        let data: AuthsignalWindowMessageData | null = null;

        try {
          data = JSON.parse(event.data) as AuthsignalWindowMessageData;
        } catch {
          // Ignore if the event data is not valid JSON
        }

        if (data?.event === AuthsignalWindowMessage.AUTHSIGNAL_CLOSE_POPUP) {
          windowHandler.close();
          resolve({token: data.token});
        }
      };

      window.addEventListener("message", onMessage, false);
    });
  }
}
