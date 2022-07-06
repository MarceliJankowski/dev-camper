import { vi, it, expect } from "vitest";
import logErr from "./logErr";

vi.stubGlobal("console", { error: vi.fn() });

it("invokes console.error with formated error", () => {
  const inputMessage = "input test message";
  const inputErr = new Error("test error");
  const expectedFormatedErr = "\n" + inputMessage.toUpperCase() + "\n" + inputErr + "\n";

  logErr(inputMessage, inputErr);

  expect(console.error).toBeCalledWith(expectedFormatedErr);
});
