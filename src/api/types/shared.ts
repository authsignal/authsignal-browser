import {CredentialDeviceType} from "@simplewebauthn/types";

export type ApiClientOptions = {
  baseUrl: string;
  tenantId: string;
  onTokenExpired?: () => void;
};

export type VerifyResponse = {
  isVerified: boolean;
  accessToken?: string;
  failureReason?: string;
};

export type ErrorResponse = {
  error: string;
  // eslint-disable-next-line @typescript-eslint/ban-types -- This is a valid use case for an empty object
  errorCode?: "expired_token" | (string & {});
  errorDescription?: string;
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
