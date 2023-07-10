// PACKAGES
import { it, vi, expect, describe, afterEach } from "vitest";
import mongoose from "mongoose";

// MODULES
import { IntentionalError } from "../utils";
import { SendError } from "./globalErrorHandler";

describe("new SendError()", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  const resStubJSON = vi.fn();
  const resStubStatus = vi.fn((_statusCode: number) => ({ json: resStubJSON }));
  const resStub: any = {
    status: resStubStatus,
  };

  it("development - responds with all available data", () => {
    vi.stubEnv("NODE_ENV", "development");
    const inputErr = new IntentionalError("test error message", 400);
    const expectedResBody = {
      status: "fail",
      message: inputErr.message,
      error: inputErr,
      stack: inputErr.stack,
    };

    new SendError(inputErr, resStub);

    expect(resStubStatus).toBeCalledWith(inputErr.statusCode);
    expect(resStubJSON).toBeCalledWith(expectedResBody);
  });

  it("development - automatically infers 'status' and 'statusCode' when not present", () => {
    vi.stubEnv("NODE_ENV", "development");
    const inputErr = new Error("test error message");
    const expectedStatusCode = 500;
    const expectedStatus = "error";

    new SendError(inputErr, resStub);

    expect(resStubStatus).toBeCalledWith(expectedStatusCode);
    expect(resStubJSON).toBeCalledWith(expect.objectContaining({ status: expectedStatus }));
  });

  it("development - standardizes primitive err argument by wrapping it in Error constructor", () => {
    vi.stubEnv("NODE_ENV", "development");
    const inputPrimitiveErr = "test error";
    const expectedError = new Error(inputPrimitiveErr);

    new SendError(inputPrimitiveErr, resStub);

    expect(resStubJSON).toBeCalledWith(
      expect.objectContaining({ message: expectedError.message, error: expectedError })
    );
  });

  it("raises exception when 'NODE_ENV' env variable is invalid", () => {
    vi.stubEnv("NODE_ENV", "invalid value");
    const inputErr = new IntentionalError("test error message", 404);
    const expectedErr = new RegExp(`NODE_ENV: '${process.env.NODE_ENV}' is invalid`);

    const wrapperFn = () => new SendError(inputErr, resStub);

    expect(wrapperFn).toThrow(expectedErr);
  });

  it("production - responds with generic data template", () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputErr = new Error("test error message");
    const expectedStatusCode = 500;
    const expectedResBody = {
      status: "error",
      message: "something went wrong",
    };

    new SendError(inputErr, resStub);

    expect(resStubStatus).toBeCalledWith(expectedStatusCode);
    expect(resStubJSON).toBeCalledWith(expectedResBody);
  });

  it("production - responds with actual data when error is an instance of IntentionalError", () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputErrStatusCode = 400;
    const inputErr = new IntentionalError("test error message", inputErrStatusCode);
    const expectedResBody = {
      status: inputErr.status,
      message: inputErr.message,
    };

    new SendError(inputErr, resStub);

    expect(resStubStatus).toBeCalledWith(inputErrStatusCode);
    expect(resStubJSON).toBeCalledWith(expectedResBody);
  });

  it("production - handles mongoose CastError", () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputCastError = new mongoose.Error.CastError("ObjectId", "uncoercible/invalid id", "_id");
    const expectedStatusCode = 400;
    const expectedResBody = {
      status: "fail",
      message: `invalid id: '${inputCastError.value}' passed to '${inputCastError.path}' field`,
    };

    new SendError(inputCastError, resStub);

    expect(resStubStatus).toBeCalledWith(expectedStatusCode);
    expect(resStubJSON).toBeCalledWith(expectedResBody);
  });

  it("production - handles mongoose ValidationError", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputErrors = ["first error message", "second error message"];
    const inputValidationError = new mongoose.Error.ValidationError();
    inputValidationError.errors = {
      field1: new mongoose.Error.ValidatorError({ message: inputErrors[0] }),
      field2: new mongoose.Error.ValidatorError({ message: inputErrors[1] }),
    };
    const expectedStatusCode = 400;
    const expectedResBody = {
      status: "fail",
      message: inputErrors.join(", "),
    };

    console.log(inputValidationError instanceof mongoose.Error.ValidatorError);

    new SendError(inputValidationError, resStub);

    expect(resStubStatus).toBeCalledWith(expectedStatusCode);
    expect(resStubJSON).toBeCalledWith(expectedResBody);
  });

  it("production - handles MongoDB 11000 (duplicate value for a field with unique index) error", () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputFieldName = "name";
    const inputFieldValue = "fake duplicate value";
    const inputError = Object.assign(new Error(), {
      code: 11000,
      keyValue: {
        [inputFieldName]: inputFieldValue,
      },
    });
    const expectedStatusCode = 400;
    const expectedResBody = {
      status: "fail",
      message: `field '${inputFieldName}' received duplicate value: '${inputFieldValue}'`,
    };

    new SendError(inputError, resStub);

    expect(resStubStatus).toBeCalledWith(expectedStatusCode);
    expect(resStubJSON).toBeCalledWith(expectedResBody);
  });
});
