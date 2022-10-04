import {v4 as uuidv4} from "uuid";

import {setCookie, getCookieDomain, getCookie} from "./helpers";
import {
  AuthsignalOptions,
  AuthsignalWindowMessage,
  AuthsignalWindowMessageData,
  LaunchOptions,
  TokenPayload,
} from "./types";
import {PopupHandler} from "./popup-handler";

const DEFAULT_COOKIE_NAME = "__as_aid";

export class Authsignal {
  anonymousId = "";
  cookieDomain = "";
  anonymousIdCookieName = "";
  publishableKey = "";

  private _token: string | undefined = undefined;

  constructor({publishableKey, cookieDomain, cookieName}: AuthsignalOptions) {
    this.publishableKey = publishableKey;
    this.cookieDomain = cookieDomain || getCookieDomain();
    this.anonymousIdCookieName = cookieName || DEFAULT_COOKIE_NAME;

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
  launch(url: string, options?: LaunchOptions) {
    if (!options?.mode || options.mode === "redirect") {
      window.location.href = url;
    } else {
      const {popupOptions} = options;

      const Popup = new PopupHandler({width: popupOptions?.width, height: popupOptions?.height});

      const popupUrl = `${url}&mode=popup`;

      Popup.show({url: popupUrl});

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

            Popup.close();
          }
        };

        Popup.on("hide", () => {
          resolve({token: this._token});
        });

        window.addEventListener("message", onMessage, false);
      });
    }
  }
}
