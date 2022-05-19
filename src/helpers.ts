import {v4 as uuidv4} from "uuid";

export const setCookie = (name: string, value: string, expire: number, domain: string, secure: boolean): void => {
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
  return location.hostname.replace("www.", "");
};

export const generateId = (): string => {
  return uuidv4();
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

export const getHostWithProtocol = (host: string) => {
  while (endsWith(host, "/")) {
    host = host.substr(0, host.length - 1);
  }
  if (host.indexOf("https://") === 0 || host.indexOf("http://") === 0) {
    return host;
  } else {
    return "//" + host;
  }
};

function endsWith(str: string, suffix: string) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

export const reformatDate = (strDate: string) => {
  const end = strDate.split(".")[1];
  if (!end) {
    return strDate;
  }
  if (end.length >= 7) {
    return strDate;
  }
  return strDate.slice(0, -1) + "0".repeat(7 - end.length) + "Z";
};
