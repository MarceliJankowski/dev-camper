// PACKAGES
import { ErrorRequestHandler, Response } from "express";

// PROJECT_MODULES
import { IntentionalError, getEnvVar } from "../utils";

type OptionalErrorPropertiesFromPackages = Partial<{
  path: string;
  value: unknown;
  code: number;
  keyValue: { [key: string]: unknown };
  errors: Array<{ message: string }>;
}>;

interface ExtendedError extends Error, OptionalErrorPropertiesFromPackages {
  statusCode: number;
  status: StatusType;
  isIntentional?: true;
}

/**SendError is responsible for sending error responses based on NODE_ENV env variable.
It exposes all data in development, while in production it will hide data to prevent breaches*/
export class SendError {
  private err: ExtendedError;

  constructor(err: Error | ExtendedError, private readonly res: Response) {
    // if error object doesn't have statusCode nor status properties then it's not IntentionalError
    // which in turn means that it's a server internal error, so treat it as such
    (err as ExtendedError).statusCode ??= 500;
    (err as ExtendedError).status ??= "error";

    this.err = err as ExtendedError;
  }

  public sendErrorBasedOnNodeEnv() {
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
        throw new Error(`NODE_ENV: ${NODE_ENV} is invalid. Expected values: production or development`);
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

  /**set this.err to new IntentionalError based on arguments
  @param message is the new message
  @param statusCode is the new statusCode, when omitted it defaults to 400*/
  private setError(message: string, statusCode: number = 400) {
    this.err = new IntentionalError(message, statusCode);
  }

  // PACKAGE EXCEPTION HANDLERS

  /**mongodb encountered duplicate value for field with unique index on it*/
  private duplicateFieldValue() {
    const [field, value] = Object.entries(this.err.keyValue!)[0];
    this.setError(`Duplicate value: ${value} for: ${field} field`);
  }

  /** mongoose wasn't able to convert document id (passed for instance to .findById query method) into valid document identifier*/
  private cantConvertParamToId() {
    this.setError(`Invalid value: ${this.err.value} for: ${this.err.path} field`);
  }

  /**mongoose received field with invalid type. For instance number field got string as input*/
  private validationError() {
    const errorMessages = Object.values(this.err.errors!).map(({ message }) => message);
    this.setError(`Invalid input data: ${errorMessages.join(" && ")}`);
  }

  private sendErrorInProduction() {
    // PACKAGE SPECIFIC EXCEPTIONS:

    // MONGOOSE
    if (this.err.name === "ValidationError") this.validationError();
    if (this.err.name === "CastError") this.cantConvertParamToId();
    if (this.err.code === 11000) this.duplicateFieldValue();

    // expose more data if it's IntentionalError (which in turn also works for package specific exceptions)
    if (this.err instanceof IntentionalError) {
      this.res.status(this.err.statusCode).json({
        status: this.err.status,
        message: this.err.message,
      });

      return;
    }

    // if it's not IntentionalError don't expose the data due to security concerns. In this case it has to be either server internal error or a bug
    this.res.status(500).json({
      status: "error",
      message: "something went wrong",
    });
  }
}

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  new SendError(err, res).sendErrorBasedOnNodeEnv();
};

export default globalErrorHandler;
