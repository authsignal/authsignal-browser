// import * as FingerprintJS from "@fingerprintjs/fingerprintjs";

// import {setCookie, generateId, getCookieDomain, getCookie, getHostWithProtocol, reformatDate} from "./helpers";
import {
  Challenge,
  // AuthsignalOptions,
  // AnonymousId,
  // RegisterAnonymousIdRequest,
  // RegisterIdentityRequest,
  // UserProps,
  Mfa,
} from "./types";
import {PopupHandler} from "./PopupHandler";

export class AuthsignalBrowser {
  // private anonymousId = "";
  // private publishableKey = "";
  // private cookieDomain = "";
  // private idCookieName = "";
  // private trackingHost = "";
  // Could do with a fingerprintClient interface
  // private fingerprintClient?: FingerprintJS.Agent;
  // private deviceFingerprint?: string;

  // async init(publishableKey: string, options?: AuthsignalOptions) {
  //   this.cookieDomain = options?.cookieDomain || getCookieDomain();
  //   this.idCookieName = options?.cookieName || "__as_aid";

  //   this.trackingHost = getHostWithProtocol(options?.trackingHost || "t.authsignal.com");
  //   this.fingerprintClient = await FingerprintJS.load({
  //     monitoring: false,
  //   });

  //   const anonymousId = this.getAnonymousId();
  //   this.anonymousId = anonymousId.idCookie;
  //   const isGeneratedAnonymousId = anonymousId.generated;

  //   const agent = await this.fingerprintClient.get();
  //   this.deviceFingerprint = agent.visitorId;

  //   if (!publishableKey) {
  //     throw Error("IntegrationError");
  //   }
  //   this.publishableKey = publishableKey;

  //   // If the anonymous Id is newly generated
  //   // register it to the authsignal backend
  //   if (isGeneratedAnonymousId) {
  //     const registerAnonymousIdRequest = this.buildRegisterAnonymousIdRequest();
  //     await this.registerAnonymousId(registerAnonymousIdRequest);
  //   }
  // }

  // async identify(props: UserProps): Promise<void> {
  //   console.log("AS user identified", props);

  //   const request = {...props, anonymousId: this.anonymousId};
  //   return await this.registerIdentity(request);
  // }

  // private getAnonymousId(): AnonymousId {
  //   const idCookie = getCookie(this.idCookieName);
  //   if (idCookie) {
  //     return {idCookie, generated: false};
  //   }
  //   const newId = generateId();

  //   setCookie("__as_aid", newId, Infinity, this.cookieDomain, document.location.protocol !== "http:");

  //   return {idCookie: newId, generated: true};
  // }

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

  // private async registerIdentity(request: RegisterIdentityRequest): Promise<void> {
  //   console.log(request);
  //   const result = await this.sendJson("identity", request);

  //   return result;
  // }

  // private async registerAnonymousId(request: RegisterAnonymousIdRequest): Promise<void> {
  //   console.log(request);
  //   const result = await this.sendJson("register", request);

  //   return result;
  // }

  // private buildRegisterAnonymousIdRequest(): RegisterAnonymousIdRequest {
  //   const now = new Date();

  //   return {
  //     deviceFingerprint: this.deviceFingerprint || "",
  //     anonymousId: this.anonymousId,
  //     sourceHost: this.cookieDomain,
  //     utcTime: reformatDate(now.toISOString()),
  //     clientData: {
  //       userAgent: navigator.userAgent || "",
  //       fonts: screen.width + "x" + screen.height,
  //       language: navigator.language,
  //       tzOffset: now.getTimezoneOffset(),
  //       screenResolution: screen.width + "x" + screen.height,
  //       viewPort:
  //         Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) +
  //         "x" +
  //         Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
  //     },
  //   };
  // }

  // private sendJson(path: string, payload: unknown) {
  //   const jsonString = JSON.stringify(payload);
  //   const url = `${this.trackingHost}/api/v1/client/${path}?publishableKey=${this.publishableKey}`;

  //   // Think about encapsulating the payloads around a message contract
  //   // SDK client versions, additional meta data
  //   return this.xmlHttpReqTransport(url, jsonString);
  // }

  // private xmlHttpReqTransport(url: string, json: string): Promise<void> {
  //   const req = new XMLHttpRequest();
  //   return new Promise((resolve, reject) => {
  //     req.onerror = () => {
  //       reject(new Error(`Failed to send JSON. See console logs`));
  //     };
  //     req.onload = () => {
  //       if (req.status !== 200) {
  //         reject(new Error(`Failed to send JSON. Error code: ${req.status}. See logs for details`));
  //       }
  //       resolve();
  //     };
  //     req.open("POST", url);
  //     req.setRequestHeader("Content-Type", "application/json");
  //     req.send(json);
  //   });
  // }
}
