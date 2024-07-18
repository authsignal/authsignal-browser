import {ErrorResponse} from "./api/types";

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

export function logErrorResponse(errorResponse: ErrorResponse) {
  console.error(errorResponse.errorDescription ?? errorResponse.error);
}
