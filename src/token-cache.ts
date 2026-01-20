import {ErrorCode} from "./types";

export class TokenCache {
  public token: string | null = null;
  public static shared = new TokenCache();

  handleTokenNotSetError() {
    const errorCode = ErrorCode.token_not_set;
    const errorDescription = "A token has not been set. Call 'setToken' first.";

    console.error(`Error: ${errorDescription}`);

    return {
      error: errorCode,
      errorCode,
      errorDescription,
    };
  }
}
