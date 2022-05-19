export type AuthsignalChallenge = {
  accessToken: string;
  challengeUrl: string;
};

export type AnnoymousId = {
  idCookie: string;
  generated: boolean;
};

export type RegisterAnonymousIdRequest = {
  deviceFingerprint: string;
  anonymousId: string;
  sourceHost: string;
  utcTime: string;
  clientData: {
    userAgent: string;
    fonts?: string;
    language?: string;
    tzOffset?: number;
    screenResolution?: string;
    viewPort?: string;
  };
};

export interface RegisterIdentityRequest {
  anonymousId: string;
  id?: string;
  email?: string;
}

export interface UserProps {
  id?: string;
  email?: string;
}

export type AuthsignalOptions = {
  /**
   * Cookie domain that will be used to identify
   * users. If not set, location.hostname will be used
   */
  cookie_domain?: string;
  /**
   * Tracking host (where API calls will be sent). If not set,
   * we'd try to do the best to "guess" it. Last resort is t.authsignal.com.
   *
   * Though this parameter is not required, it's highly recommended to set is explicitly
   */
  tracking_host?: string;

  /**
   * Name of id cookie. __eventn_id by default
   */
  cookie_name?: string;
};
