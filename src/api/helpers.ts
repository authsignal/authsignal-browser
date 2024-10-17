import {ErrorResponse} from "./types/shared";

type BuildHeadersParams = {
  token?: string;
  tenantId: string;
};

export function buildHeaders({token, tenantId}: BuildHeadersParams) {
  const authorizationHeader = token ? `Bearer ${token}` : `Basic ${window.btoa(encodeURIComponent(tenantId))}`;

  return {
    "Content-Type": "application/json",
    Authorization: authorizationHeader,
  };
}

type HandleTokenExpiredParams<T> = {
  response: T | ErrorResponse;
  onTokenExpired?: () => void;
};

export function handleTokenExpired<T extends object>({response, onTokenExpired}: HandleTokenExpiredParams<T>) {
  if ("error" in response && response.errorCode === "expired_token" && onTokenExpired) {
    onTokenExpired();
  }
}
