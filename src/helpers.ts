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

export function handleErrorResponse(errorResponse: ErrorResponse) {
  const error = errorResponse.errorDescription ?? errorResponse.error;

  console.error(error);

  return {
    error,
  };
}

export function handleApiResponse<T>(response: ErrorResponse | T) {
  if (response && typeof response === "object" && "error" in response) {
    const error = response.errorDescription ?? response.error;

    console.error(error);

    return {
      error,
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
      data: response,
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
