// PACKAGES
import { ErrorRequestHandler, Response } from "express";

// MODULES
import { IntentionalError, getEnvVar } from "../utils";

interface ExtendedError extends Error {
  statusCode: number;
  status: StatusType;
  isIntentional?: true;
}

/**@desc sends exception to the client based on `NODE_ENV`:
@development exposes all data
@production responds only with data deemed "safe" (security breach prevention)*/
export class SendError {
  private err: ExtendedError;

  constructor(err: Error | ExtendedError, private readonly res: Response) {
    // these properties not being defined indicate that it's a server internal error, so treat it as such
    (err as ExtendedError).statusCode ??= 500;
    (err as ExtendedError).status ??= "error";
    this.err = err as ExtendedError;

    this.sendErrorBasedOnNodeEnv();
  }

  private sendErrorBasedOnNodeEnv() {
    const NODE_ENV = getEnvVar("NODE_ENV");

    switch (NODE_ENV) {
      case "production": {
        this.sendErrorInProduction();
        break;
      }

      case "development": {
        this.sendErrorInDevelopment();
        break;
      }

      default: {
        throw new Error(`NODE_ENV: '${NODE_ENV}' is invalid`);
      }
    }
  }

  private sendErrorInDevelopment() {
    this.res.status(this.err.statusCode).json({
      status: this.err.status,
      message: this.err.message,
      error: this.err,
      stack: this.err.stack,
    });
  }

  private sendErrorInProduction() {
    // expose actual data in case it's an IntentionalError
    if (this.err instanceof IntentionalError) {
      this.res.status(this.err.statusCode).json({
        status: this.err.status,
        message: this.err.message,
      });

      return;
    }

    // respond with generic template when it's an internal server error
    this.res.status(500).json({
      status: "error",
      message: "something went wrong",
    });
  }
}

/**@desc propagates exceptions to the client based on `NODE_ENV`*/
export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  new SendError(err, res);
};
