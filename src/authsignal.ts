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

const DEFAULT_COOKIE_NAME = "__as_aid";
const DEFAULT_PROFILING_COOKIE_NAME = "__as_pid";

const DEFAULT_BASE_URL = "https://api.authsignal.com/v1";

const TMX_ORG_ID = "4a08uqve";

export class Authsignal {
  anonymousId = "";
  profilingId = "";
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

  initAdvancedProfiling(baseUrl?: string): undefined {
    const profilingId = uuidv4();
    this.profilingId = profilingId;
    setCookie({
      name: DEFAULT_PROFILING_COOKIE_NAME,
      value: profilingId,
      expire: Infinity,
      domain: this.cookieDomain,
      secure: document.location.protocol !== "http:",
    });

    const tmxProfilingScruiptUrl = baseUrl
      ? `${baseUrl}/fp/tags.js?org_id=${TMX_ORG_ID}&session_id=${profilingId}`
      : `https://h.online-metrix.net/fp/tags.js?org_id=${TMX_ORG_ID}&session_id=${profilingId}`;
    const script = document.createElement("script");
    script.src = tmxProfilingScruiptUrl;
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
