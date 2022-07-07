// PACKAGES
import { describe, it, vi, expect, afterEach } from "vitest";

// PROJECT_MODULES
import { IntentionalError } from "../utils";
import { SendError } from "./globalErrorHandler";

describe("new SendError().sendErrorBasedOnNodeEnv", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;

    vi.clearAllMocks();
  });

  const resJsonSpy = vi.fn();

  const mockRes: any = {
    status(_statusCode: number) {
      return { json: resJsonSpy };
    },
  };

  it("is defined and it's a method", () => {
    const inputErr = new Error("test error message");

    const { sendErrorBasedOnNodeEnv } = new SendError(inputErr, mockRes);

    expect(sendErrorBasedOnNodeEnv).toBeDefined();
    expect(sendErrorBasedOnNodeEnv).toBeTypeOf("function");
  });

  it("correctly sends error in development (exposes all the data)", () => {
    const inputErr = new IntentionalError("test error message", 404);

    process.env.NODE_ENV = "development";
    new SendError(inputErr, mockRes).sendErrorBasedOnNodeEnv();

    expect(resJsonSpy).toHaveBeenCalledWith({
      status: inputErr.status,
      message: inputErr.message,
      error: inputErr,
      stack: inputErr.stack,
    });
  });

  it("throws exception when NODE_ENV environmental variable is invalid (neither development nor production)", () => {
    const inputErr = new IntentionalError("test error message", 404);
    const expectedErrRegExp = /NODE_ENV.*is invalid/;

    const testFn = () => new SendError(inputErr, mockRes).sendErrorBasedOnNodeEnv();

    process.env.NODE_ENV = "";
    expect(testFn).toThrow(expectedErrRegExp);

    process.env.NODE_ENV = "test value";
    expect(testFn).toThrow(expectedErrRegExp);
  });

  it("is not exposing data in production (security) when error isn't an instance of IntentionalError", () => {
    const inputErr = new Error("test error message");

    process.env.NODE_ENV = "production";
    new SendError(inputErr, mockRes).sendErrorBasedOnNodeEnv();

    expect(resJsonSpy).toHaveBeenCalledWith({
      status: "error",
      message: "something went wrong",
    });
  });

  it("in production it sends response with actual data when error is an instance of IntentionalError", () => {
    const inputErr = new IntentionalError("test error message", 400);

    process.env.NODE_ENV = "production";
    new SendError(inputErr, mockRes).sendErrorBasedOnNodeEnv();

    expect(resJsonSpy).toHaveBeenCalledWith({
      status: inputErr.status,
      message: inputErr.message,
    });
  });

  it("handles mongoose 'CastError' in production", () => {
    const testCastError = Object.assign(new Error(), { name: "CastError", path: "_id", value: "test value" });

    process.env.NODE_ENV = "production";
    new SendError(testCastError, mockRes).sendErrorBasedOnNodeEnv();

    expect(resJsonSpy).toBeCalledWith({
      status: "fail",
      message: `Invalid value: ${testCastError.value} for: ${testCastError.path} field`,
    });
  });

  it("handles mongoose 'ValidationError' in production", () => {
    const errorMessagesArray = ["first test message", "second test message"];
    const expectedResBody = {
      status: "fail",
      message: `Invalid input data: ${errorMessagesArray.join(" && ")}`,
    };

    const inputErr = Object.assign(new Error(), {
      name: "ValidationError",
      errors: errorMessagesArray.map(message => ({ message })),
    });

    process.env.NODE_ENV = "production";
    new SendError(inputErr, mockRes).sendErrorBasedOnNodeEnv();

    expect(resJsonSpy).toBeCalledWith(expectedResBody);
  });

  it("handles mongoose 11000 (duplicate field value) error in production", () => {
    const fieldName = "name";
    const fieldValue = "duplicate value";
    const inputErr = Object.assign(new Error(), {
      code: 11000,
      keyValue: {
        [fieldName]: fieldValue,
      },
    });
    const expectedResBody = {
      status: "fail",
      message: `Duplicate value: ${fieldValue} for: ${fieldName} field`,
    };

    process.env.NODE_ENV = "production";
    new SendError(inputErr, mockRes).sendErrorBasedOnNodeEnv();

    expect(resJsonSpy).toBeCalledWith(expectedResBody);
  });
});
