// PACKAGES
import { it, vi, expect, describe, afterEach } from "vitest";

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

  it("development - responds with all available data, automatically infers 'status' and 'statusCode' when not present", () => {
    vi.stubEnv("NODE_ENV", "development");
    const inputErr = new Error("test error message");
    const expectedStatusCode = 500;
    const expectedStatus = "error";

    new SendError(inputErr, resStub);

    expect(resStubStatus).toBeCalledWith(expectedStatusCode);
    expect(resStubJSON).toBeCalledWith({
      status: expectedStatus,
      message: inputErr.message,
      error: inputErr,
      stack: inputErr.stack,
    });
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
    const expectedStatus = "error";
    const expectedMessage = "something went wrong";

    new SendError(inputErr, resStub);

    expect(resStubStatus).toBeCalledWith(expectedStatusCode);
    expect(resStubJSON).toBeCalledWith({
      status: expectedStatus,
      message: expectedMessage,
    });
  });

  it("production - responds with actual data when error is an instance of IntentionalError", () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputErrStatusCode = 400;
    const inputErr = new IntentionalError("test error message", inputErrStatusCode);

    new SendError(inputErr, resStub);

    expect(resStubStatus).toBeCalledWith(inputErrStatusCode);
    expect(resStubJSON).toBeCalledWith({
      status: inputErr.status,
      message: inputErr.message,
    });
  });
});