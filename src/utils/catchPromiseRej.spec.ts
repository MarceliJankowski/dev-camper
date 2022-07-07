// PACKAGES
import { afterEach, expect, it, vi } from "vitest";

// PROJECT_MODULES
import catchPromiseRej from "./catchPromiseRej";

const inputReq: any = {};
const inputRes: any = {};

const nextFn = vi.fn();
const inputController = vi.fn(() => new Promise((resolve, _reject) => resolve("promise fulfilled")));

afterEach(() => {
  vi.clearAllMocks();
});

it("returns controller wrapper which in turn invokes input controller with required arguments", async () => {
  const wrapperController = catchPromiseRej(inputController);

  await wrapperController(inputReq, inputRes, nextFn);

  expect(inputController).toBeCalledWith(inputReq, inputRes, nextFn);
});

it("isn't invoking next function when controller response resolves", async () => {
  const wrapperController = catchPromiseRej(inputController);
  await wrapperController(inputReq, inputRes, nextFn);

  expect(nextFn).not.toBeCalled();
});

it("catches input controller promise rejection and invokes nextFn with it (which passes it to globalErrorHandler)", async () => {
  const rejectionValue = "test promise rejection";
  inputController.mockImplementationOnce(() => new Promise((_resolve, reject) => reject(rejectionValue)));

  const wrapperController = catchPromiseRej(inputController);
  await wrapperController(inputReq, inputRes, nextFn);

  expect(nextFn).toBeCalledWith(rejectionValue);
});
