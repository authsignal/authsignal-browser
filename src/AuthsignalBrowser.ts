import {v4 as uuidv4} from "uuid";

import {setCookie, getCookieDomain, getCookie} from "./helpers";
import {ChallengeInput, AuthsignalOptions, MfaInput} from "./types";
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

  mfa(input: {mode?: "redirect"} & MfaInput): undefined;
  mfa(input: {mode: "popup"} & MfaInput): Promise<boolean>;
  mfa({url, mode = "redirect"}: MfaInput) {
    if (mode === "redirect") {
      window.location.href = url;
    } else {
      const Popup = new PopupHandler();

      Popup.show({url});

      return new Promise<boolean>((resolve, reject) => {
        const handleMfa = (event: MessageEvent) => {
          if (event.data === "authsignal-mfa-success") {
            Popup.close();
            resolve(true);
          } else if (event.data === "authsignal-mfa-failure") {
            Popup.close();
            reject(false);
          }
        };

        window.addEventListener("message", handleMfa, false);
      });
    }
  }

  challenge(challenge: {mode?: "redirect"} & ChallengeInput): undefined;
  challenge(challenge: {mode: "popup"} & ChallengeInput): Promise<boolean>;
  challenge({challengeUrl, mode = "redirect"}: ChallengeInput) {
    if (mode === "redirect") {
      window.location.href = challengeUrl;
    } else {
      const Popup = new PopupHandler();

      Popup.show({url: challengeUrl});

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
