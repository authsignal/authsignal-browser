import {ErrorResponse} from "./api/types/shared";

export class TokenCache {
  public token: string | null = null;
  public static shared = new TokenCache();

  handleTokenNotSetError(): ErrorResponse {
    const error = "A token has not been set. Call 'setToken' first.";
    const errorCode = "TOKEN_NOT_SET";

    console.error(`Error: ${error}`);

    return {
      error: errorCode,
      errorDescription: error,
    };
  }
}
