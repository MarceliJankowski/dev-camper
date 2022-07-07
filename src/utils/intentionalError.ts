/**IntentionalError is meant to be used inside of middlewares whenever error should reach the client.
it provides additional informations about the error:
@isIntentional indicates that request should reach the client in production
@status indicates whether exception is a server internal "error" (server's fault) or if it's a "fail" (client's fault). It's derived from statusCode

@param statusCode  needs to fit in the range: 400-599 (including). It's used for deriving "status"*/
class IntentionalError extends Error {
  public readonly isIntentional: true;
  public readonly status: StatusErrType;

  constructor(public readonly message: string, public readonly statusCode: number) {
    if (statusCode < 400 || statusCode >= 600)
      throw new Error(
        `statusCode: ${statusCode} is invalid. IntentionalError statusCode valid range: 400-599 (including)`
      );

    super(message);

    this.isIntentional = true;
    this.status = statusCode >= 500 ? "error" : "fail";
  }
}

export default IntentionalError;
