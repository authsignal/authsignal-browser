export type ChallengeInput = {
  challengeUrl: string;
  mode?: "popup" | "redirect";
};

export type MfaInput = {
  url: string;
  mode?: "popup" | "redirect";
};

export type AuthsignalOptions = {
  publishableKey: string;
  /**
   * Cookie domain that will be used to identify
   * users. If not set, location.hostname will be used
   */
  cookieDomain?: string;
  /**
   * Tracking host (where API calls will be sent). If not set,
   * we'd try to do the best to "guess" it. Last resort is t.authsignal.com.
   *
   * Though this parameter is not required, it's highly recommended to set is explicitly
   */
  trackingHost?: string;

  /**
   * Name of id cookie. __eventn_id by default
   */
  cookieName?: string;
};
