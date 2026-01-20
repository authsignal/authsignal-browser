import {CredentialDeviceType} from "@simplewebauthn/browser";
import {ErrorCode} from "../../types";

export type ApiClientOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
};

export type EnrollResponse = {
  userAuthenticatorId: string;
  userId: string;
};

export type ChallengeResponse = {
  challengeId: string;
};

export type VerifyResponse = {
  isVerified: boolean;
  accessToken?: string;
  failureReason?: string;
  /**
   * Only present when successfully verifying an authenticator during enrollment.
   */
  userAuthenticator?: Authenticator;
};

export type ErrorResponse = {
  /**
   * @deprecated Use errorCode and errorDescription instead
   */
  error?: string;
  errorCode?: ErrorCode;
  errorDescription?: string | undefined;
};

export enum VerificationMethod {
  SMS = "SMS",
  AUTHENTICATOR_APP = "AUTHENTICATOR_APP",
  RECOVERY_CODE = "RECOVERY_CODE",
  EMAIL_MAGIC_LINK = "EMAIL_MAGIC_LINK",
  EMAIL_OTP = "EMAIL_OTP",
  PUSH = "PUSH",
  SECURITY_KEY = "SECURITY_KEY",
  PASSKEY = "PASSKEY",
  VERIFF = "VERIFF",
  IPROOV = "IPROOV",
  PALM_BIOMETRICS_RR = "PALM_BIOMETRICS_RR",
  IDVERSE = "IDVERSE",
  DEVICE = "DEVICE",
}

enum SmsChannel {
  "DEFAULT" = "DEFAULT",
  "WHATSAPP" = "WHATSAPP",
  "SMS" = "SMS",
}

enum DevicePlatform {
  "IOS" = "IOS",
  "ANDROID" = "ANDROID",
  "WEB" = "WEB",
}

type WebauthnCredential = {
  credentialId: string;
  deviceId: string;
  name: string;
  aaguid?: string;
  credentialBackedUp: boolean;
  credentialDeviceType?: CredentialDeviceType;
  parsedUserAgent?: {
    ua: string;
    browser: {
      name?: string;
      version?: string;
      major?: string;
    };
    device: {
      model?: string;
      type?: string;
      vendor?: string;
    };
    engine: {
      name?: string;
      version?: string;
    };
    os: {
      name?: string;
      version?: string;
    };
    cpu: {
      architecture?: string;
    };
  };
  verifiedAt: string;
  authenticatorAttachment?: AuthenticatorAttachment;
  aaguidMapping?: {
    name: string;
    svgIconLight?: string;
    svgIconDark?: string;
  };
};

export type Authenticator = {
  userAuthenticatorId: string;
  verificationMethod: VerificationMethod;
  createdAt: string;
  verifiedAt?: string;
  lastVerifiedAt?: string;
  isDefault?: boolean;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  authenticatorAttachment?: AuthenticatorAttachment;
  previousSmsChannel?: SmsChannel;
  devicePlatform?: DevicePlatform;
  username?: string;
  webauthnCredential?: WebauthnCredential;
};
