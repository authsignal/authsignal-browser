type CookieOptions = {
  name: string;
  value: string;
  expire: number;
  domain: string;
  secure: boolean;
};

export const setCookie = ({name, value, expire, domain, secure}: CookieOptions): void => {
  const expireString = expire === Infinity ? " expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + expire;
  document.cookie =
    encodeURIComponent(name) +
    "=" +
    value +
    "; path=/;" +
    expireString +
    (domain ? "; domain=" + domain : "") +
    (secure ? "; secure" : "");
};

export const getCookieDomain = (): string => {
  return document.location.hostname.replace("www.", "");
};

export const getCookie = (name: string) => {
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
};
