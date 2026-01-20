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

export function handleWebAuthnError(error: unknown) {
  if (error instanceof WebAuthnError && error.code === "ERROR_INVALID_RP_ID") {
    const rpId = error.message?.match(/"([^"]*)"/)?.[1] || "";

    console.error(
      `[Authsignal] The Relying Party ID "${rpId}" is invalid for this domain.\n To learn more, visit https://docs.authsignal.com/scenarios/passkeys-prebuilt-ui#defining-the-relying-party`
    );
  }
}
