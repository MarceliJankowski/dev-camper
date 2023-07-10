/**@desc Constructor instantiated inside of middlewares whenever error should reach the client
@param message functionally the same as `Error()` message
@param statusCode used for deriving `status` property (valid range: 400-599 including)*/
export class IntentionalError extends Error {
  /**@desc differentiates between internal server `"error"` (server's fault) and `"fail"` (client's fault). Derived from `statusCode`*/
  public readonly status: StatusErr;

  constructor(public readonly message: string, public readonly statusCode: number) {
    if (statusCode < 400 || statusCode >= 600)
      throw new Error(`statusCode: '${statusCode}' is invalid (valid range: 400-599 including)`);

    super(message);

    this.status = statusCode < 500 ? "fail" : "error";

    // start stack trace with IntentionalError invocation
    Error.captureStackTrace(this, this.constructor);
  }
}
