import {WebAuthnError} from "@simplewebauthn/browser";
import {ErrorResponse} from "./api/types/shared";

type CookieOptions = {
  name: string;
  value: string;
  expire: number;
  domain: string;
  secure: boolean;
};

export function setCookie({name, value, expire, domain, secure}: CookieOptions) {
  const expireString = expire === Infinity ? " expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + expire;
  document.cookie =
    encodeURIComponent(name) +
    "=" +
    value +
    "; path=/;" +
    expireString +
    (domain ? "; domain=" + domain : "") +
    (secure ? "; secure" : "");
}

export function getCookieDomain() {
  return document.location.hostname.replace("www.", "");
}

export function getCookie(name: string) {
  if (!name) {
    return null;
  }
  return (
    decodeURIComponent(
      document.cookie.replace(
        new RegExp(
          "(?:(?:^|.*;)\\s*" + encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"
        ),
        "$1"
      )
    ) || null
  );
}

type HandleErrorResponseParams = {
  errorResponse: ErrorResponse;
  enableLogging: boolean;
};

export function handleErrorResponse({errorResponse, enableLogging}: HandleErrorResponseParams) {
  if (enableLogging) {
    console.error(
      `[Authsignal] ${errorResponse.errorCode}${
        errorResponse.errorDescription ? `: ${errorResponse.errorDescription}` : ""
      }`
    );
  }

  const error = errorResponse.errorDescription ?? errorResponse.error;

  return {
    error,
    errorCode: errorResponse.errorCode,
    errorDescription: errorResponse.errorDescription,
  };
}

type HandleApiResponseParams<T> = {
  response: ErrorResponse | T;
  enableLogging: boolean;
};

export function handleApiResponse<T>({response, enableLogging}: HandleApiResponseParams<T>) {
  if (response && typeof response === "object" && "error" in response) {
    const error = response.errorDescription ?? response.error;

    if (enableLogging) {
      console.error(
        `[Authsignal] ${response.errorCode}${response.errorDescription ? `: ${response.errorDescription}` : ""}`
      );
    }

    return {
      error,
      errorCode: response.errorCode,
      errorDescription: response.errorDescription,
    };
  } else if (
    response &&
    typeof response === "object" &&
    "accessToken" in response &&
    typeof response.accessToken === "string"
  ) {
    const {accessToken, ...data} = response;

    return {
      data: {
        ...data,
        token: accessToken,
      } as T,
    };
  } else {
    return {
      data: response as T,
    };
  }
}

export function isImmediateMediationCredentialNotFoundError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

type IdentifyImmediateMediationAuthenticationErrorParams = {
  error: unknown;
  publicKey: {
    rpId?: string;
  };
};

export function identifyImmediateMediationAuthenticationError({
  error,
  publicKey,
}: IdentifyImmediateMediationAuthenticationErrorParams) {
  const errorName = getErrorName(error);

  if (!errorName) {
    return error;
  }

  if (errorName === "SecurityError") {
    const effectiveDomain = globalThis.location.hostname;

    if (!isValidDomain(effectiveDomain)) {
      return new WebAuthnError({
        message: `${globalThis.location.hostname} is an invalid domain`,
        code: "ERROR_INVALID_DOMAIN",
        cause: error as Error,
      });
    }

    if (publicKey.rpId !== effectiveDomain) {
      return new WebAuthnError({
        message: `The RP ID "${publicKey.rpId}" is invalid for this domain`,
        code: "ERROR_INVALID_RP_ID",
        cause: error as Error,
      });
    }
  }

  if (errorName === "UnknownError") {
    return new WebAuthnError({
      message:
        "The authenticator was unable to process the specified options, or could not create a new assertion signature",
      code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
      cause: error as Error,
    });
  }

  return error;
}

export function handleWebAuthnError(error: unknown) {
  if (error instanceof WebAuthnError && error.code === "ERROR_INVALID_RP_ID") {
    const rpId = error.message?.match(/"([^"]*)"/)?.[1] || "";

    console.error(
      `[Authsignal] The Relying Party ID "${rpId}" is invalid for this domain.\n To learn more, visit https://docs.authsignal.com/scenarios/passkeys-prebuilt-ui#defining-the-relying-party`
    );
  }
}

function isValidDomain(hostname: string) {
  return (
    hostname === "localhost" ||
    /^((xn--[a-z0-9-]+|[a-z0-9]+(-[a-z0-9]+)*)\.)+([a-z]{2,}|xn--[a-z0-9-]+)$/i.test(hostname)
  );
}

function getErrorName(error: unknown) {
  if (error && typeof error === "object" && "name" in error && typeof error.name === "string") {
    return error.name;
  }

  return null;
}
