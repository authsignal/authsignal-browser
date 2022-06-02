import {v4 as uuidv4} from "uuid";

import {setCookie, getCookieDomain, getCookie} from "./helpers";
import {Challenge, AuthsignalOptions, Mfa} from "./types";
import {PopupHandler} from "./PopupHandler";

export class AuthsignalBrowser {
  private anonymousId = "";
  private cookieDomain = "";
  private anonymousIdCookieName = "";
  private publishableKey = "";

  constructor({publishableKey, cookieDomain, cookieName}: AuthsignalOptions) {
    this.publishableKey = publishableKey;
    this.cookieDomain = cookieDomain || getCookieDomain();
    this.anonymousIdCookieName = cookieName || "__as_aid";

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

  mfa({url}: Mfa) {
    window.location.href = url;
  }

  challenge(challenge: {mode?: "redirect"} & Challenge): undefined;
  challenge(challenge: {mode: "popup"} & Challenge): Promise<boolean>;
  challenge({challengeUrl, mode = "redirect"}: Challenge) {
    if (mode === "redirect") {
      window.location.href = challengeUrl;
    } else {
      const Popup = new PopupHandler();

      Popup.show({challengeUrl: challengeUrl});

      return new Promise<boolean>((resolve, reject) => {
        const handleChallenge = (event: MessageEvent) => {
          if (event.data === "authsignal-challenge-success") {
            Popup.close();
            resolve(true);
          } else if (event.data === "authsignal-challenge-failure") {
            Popup.close();
            reject(false);
          }
        };

        window.addEventListener("message", handleChallenge, false);
      });
    }
  }
}
