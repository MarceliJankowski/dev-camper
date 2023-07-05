// PACKAGES
import { it, expect, vi, afterEach } from "vitest";

// MODULES
import { handlePromiseRej } from "./handlePromiseRej";

afterEach(() => {
  vi.clearAllMocks();
});

const inputController = vi.fn(() => Promise.resolve<any>("fulfilled"));
const next = vi.fn();

const inputReq: any = {};
const inputRes: any = {};

it("returns controller wrapper which in turn invokes input controller with expected arguments", async () => {
  const wrapperController = handlePromiseRej(inputController);
  await wrapperController(inputReq, inputRes, next);

  expect(inputController).toBeCalledWith(inputReq, inputRes, next);
});

it("doesn't invoke 'next' when controller promise resolves", async () => {
  const wrapperController = handlePromiseRej(inputController);
  await wrapperController(inputReq, inputRes, next);

  expect(next).not.toBeCalled();
});

it("catches controller promise rejection and invokes 'next' with it", async () => {
  const rejectionValue = "rejected";
  inputController.mockImplementationOnce(() => Promise.reject(rejectionValue));

  const wrapperController = handlePromiseRej(inputController);
  await wrapperController(inputReq, inputRes, next);

  expect(next).toBeCalledWith(rejectionValue);
});
