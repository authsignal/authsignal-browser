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
import {PopupHandler} from "./handlers/popup-handler";
import {Passkey} from "./passkey";
import {WindowHandler} from "./handlers/window-handler";

const DEFAULT_COOKIE_NAME = "__as_aid";

const DEFAULT_BASE_URL = "https://api.authsignal.com/v1";

export class Authsignal {
  anonymousId = "";
  cookieDomain = "";
  anonymousIdCookieName = "";
  passkey: Passkey;

  private _token: string | undefined = undefined;

  constructor({
    cookieDomain,
    cookieName = DEFAULT_COOKIE_NAME,
    baseUrl = DEFAULT_BASE_URL,
    tenantId,
  }: AuthsignalOptions) {
    this.cookieDomain = cookieDomain || getCookieDomain();
    this.anonymousIdCookieName = cookieName;

    if (!tenantId) {
      throw new Error("tenantId is required");
    }

    this.passkey = new Passkey({tenantId, baseUrl});

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
  }

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

  private launchWithRedirect(url: string) {
    window.location.href = url;
  }

  private launchWithPopup(url: string, options: PopupLaunchOptions) {
    const {popupOptions} = options;

    const popupHandler = new PopupHandler({width: popupOptions?.width});

    const popupUrl = `${url}&mode=popup`;

    popupHandler.show({url: popupUrl});

    return new Promise<TokenPayload>((resolve) => {
      const onMessage = (event: MessageEvent) => {
        let data: AuthsignalWindowMessageData | null = null;

        try {
          data = JSON.parse(event.data) as AuthsignalWindowMessageData;
        } catch {
          // Ignore if the event data is not valid JSON
        }

        if (data?.event === AuthsignalWindowMessage.AUTHSIGNAL_CLOSE_POPUP) {
          this._token = data.token;

          popupHandler.close();
        }
      };

      popupHandler.on("hide", () => {
        resolve({token: this._token});
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
          this._token = data.token;

          windowHandler.close();
          resolve({token: this._token});
        }
      };

      window.addEventListener("message", onMessage, false);
    });
  }
}
