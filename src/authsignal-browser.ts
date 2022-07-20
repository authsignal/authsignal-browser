import {v4 as uuidv4} from "uuid";

import {setCookie, getCookieDomain, getCookie} from "./helpers";
import {AuthsignalOptions, AuthsignalWindowMessage, HandleUrlInput} from "./types";
import {PopupHandler} from "./popup-handler";

const DEFAULT_ENDPOINT = "https://mfa.authsignal.com/";
const DEFAULT_COOKIE_NAME = "__as_aid";

export class AuthsignalBrowser {
  anonymousId = "";
  cookieDomain = "";
  anonymousIdCookieName = "";
  publishableKey = "";
  endpoint = "";

  constructor({publishableKey, cookieDomain, cookieName, endpoint}: AuthsignalOptions) {
    this.publishableKey = publishableKey;
    this.cookieDomain = cookieDomain || getCookieDomain();
    this.anonymousIdCookieName = cookieName || DEFAULT_COOKIE_NAME;
    this.endpoint = endpoint || DEFAULT_ENDPOINT;

    const idCookie = getCookie(this.anonymousIdCookieName);

    if (!idCookie) {
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

  handleUrl(input: {mode?: "redirect"} & HandleUrlInput): undefined;
  handleUrl(input: {mode: "popup"} & HandleUrlInput): Promise<boolean>;
  handleUrl({url, mode = "redirect"}: HandleUrlInput) {
    if (mode === "redirect") {
      window.location.href = url;
    } else {
      const Popup = new PopupHandler();

      Popup.show({url});

      return new Promise<boolean>((resolve) => {
        const handleMfa = (event: MessageEvent) => {
          if (event.origin === this.endpoint) {
            if (event.data === AuthsignalWindowMessage.AUTHSIGNAL_CLOSE_POPUP) {
              Popup.close();
              resolve(true);
            }
          }
        };

        window.addEventListener("message", handleMfa, false);
      });
    }
  }
}
