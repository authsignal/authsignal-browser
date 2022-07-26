import {v4 as uuidv4} from "uuid";

import {setCookie, getCookieDomain, getCookie} from "./helpers";
import {AuthsignalOptions, AuthsignalWindowMessage, MfaInput, ChallengeInput, LaunchOptions} from "./types";
import {PopupHandler} from "./popup-handler";

const DEFAULT_ENDPOINT = "https://mfa.authsignal.com";
const DEFAULT_COOKIE_NAME = "__as_aid";

export class Authsignal {
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

  /**
   * @deprecated Use launch() instead.
   */
  mfa(challenge: {mode?: "redirect"} & MfaInput): undefined;
  mfa(challenge: {mode: "popup"} & MfaInput): Promise<boolean>;
  mfa({mode, url}: MfaInput) {
    if (mode === "popup") {
      return this.launch(url, {mode});
    }
    return this.launch(url, {mode});
  }

  /**
   * @deprecated Use launch() instead.
   */
  challenge(challenge: {mode?: "redirect"} & ChallengeInput): undefined;
  challenge(challenge: {mode: "popup"} & ChallengeInput): Promise<boolean>;
  challenge({mode, challengeUrl: url}: ChallengeInput) {
    if (mode === "popup") {
      return this.launch(url, {mode});
    }
    return this.launch(url, {mode});
  }

  launch(url: string, options?: {mode?: "redirect"} & LaunchOptions): undefined;
  launch(url: string, options?: {mode: "popup"} & LaunchOptions): Promise<boolean>;
  launch(url: string, options?: LaunchOptions) {
    const mode = options?.mode || "redirect";

    if (mode === "redirect") {
      window.location.href = url;
    } else {
      const Popup = new PopupHandler();

      Popup.show({url});

      return new Promise<boolean>((resolve) => {
        const onMessage = (event: MessageEvent) => {
          if (event.origin === this.endpoint) {
            if (event.data === AuthsignalWindowMessage.AUTHSIGNAL_CLOSE_POPUP) {
              Popup.close();
            }
          }
        };

        Popup.on("hide", () => {
          resolve(true);
        });

        window.addEventListener("message", onMessage, false);
      });
    }
  }
}

/**
 * @deprecated Use Authsignal
 */
export class AuthsignalBrowser extends Authsignal {}
