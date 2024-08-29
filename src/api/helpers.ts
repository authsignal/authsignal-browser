import {version} from "../../package.json";

type BuildHeadersParams = {
  token?: string;
  tenantId: string;
};

export function buildHeaders({token, tenantId}: BuildHeadersParams) {
  const authorizationHeader = token ? `Bearer ${token}` : `Basic ${window.btoa(encodeURIComponent(tenantId))}`;

  return {
    "Content-Type": "application/json",
    Authorization: authorizationHeader,
    "X-Authsignal-Browser-Version": version,
  };
}
