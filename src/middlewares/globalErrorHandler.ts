// PACKAGES
import { ErrorRequestHandler, Response } from "express";
import mongoose from "mongoose";

// MODULES
import { IntentionalError, getEnvVar } from "../utils";

interface MongoDuplicateValueError {
  code: number;
  keyValue: { [key: string]: unknown };
}

type StandardizedError = Error & Partial<IntentionalError & MongoDuplicateValueError>;

/**@desc sends exception to the client based on `NODE_ENV`:
@development exposes all data
@production only responds with data deemed "safe" (security breach prevention)*/
export class SendError {
  private err: StandardizedError;

  constructor(err: unknown, private readonly res: Response) {
    // standardize err argument by wrapping it in Error
    if (!(err instanceof Error)) this.err = new Error(String(err));
    else this.err = err;

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
    this.res.status(this.err.statusCode ?? 500).json({
      status: this.err.status ?? "error",
      message: this.err.message,
      error: this.err,
      stack: this.err.stack,
    });
  }

  private setError(message: string, statusCode: number = 400) {
    this.err = new IntentionalError(message, statusCode);
  }

  /**@desc handles `MongoDB` collection receiving duplicate value for a field with unique index on it*/
  private handleMongoDuplicateValue() {
    if (this.err.code !== 11000) return;
    const mongoError = this.err as MongoDuplicateValueError;

    const [field, value] = Object.entries(mongoError.keyValue)[0];
    this.setError(`field '${field}' received duplicate value: '${value}'`);
  }

  /**@desc handles `mongoose` receiving invalid document id*/
  private handleMongooseInvalidDocumentId() {
    if (!(this.err instanceof mongoose.Error.CastError)) return;

    this.setError(`invalid id: '${this.err.value}' passed to '${this.err.path}' field`);
  }

  /**@desc handles `mongoose` receiving value with invalid type (for instance `number` field receiving a `string`)*/
  private handleMongooseInvalidType() {
    if (!(this.err instanceof mongoose.Error.ValidationError)) return;

    const preparedErrMessage = Object.values(this.err.errors)
      .map(({ message }) => message)
      .join(", ");

    this.setError(preparedErrMessage);
  }

  private sendErrorInProduction() {
    // HANDLE PACKAGE SPECIFIC EXCEPTIONS
    this.handleMongoDuplicateValue();
    this.handleMongooseInvalidDocumentId();
    this.handleMongooseInvalidType();

    // expose actual data in case it's an IntentionalError (includes handled package exceptions)
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
