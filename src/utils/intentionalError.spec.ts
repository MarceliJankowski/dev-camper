// PACKAGES
import { it, expect } from "vitest";

// PROJECT_MODULES
import IntentionalError from "./intentionalError";

const inputMessage = "input message";

it("generates instance with expected key / value pairs", () => {
  const inputStatusCode = 500;
  const expectedProperties = [
    { key: "message", value: inputMessage },
    { key: "statusCode", value: inputStatusCode },
    { key: "isIntentional", value: true },
    { key: "status", value: "error" },
  ];

  const testErr = new IntentionalError(inputMessage, inputStatusCode);

  expectedProperties.forEach(({ key, value }) => {
    expect(testErr).toHaveProperty(key);
    expect(testErr[key]).toBe(value);
  });
});

it("correctly generates value for status property based on statusCode", () => {
  const inputStatusCode1 = 404;
  const expectedStatus1 = "fail";

  const inputStatusCode2 = 500;
  const expectedStatus2 = "error";

  const testErr1 = new IntentionalError(inputMessage, inputStatusCode1);
  const testErr2 = new IntentionalError(inputMessage, inputStatusCode2);

  expect(testErr1.status).toBe(expectedStatus1);
  expect(testErr2.status).toBe(expectedStatus2);
});

it("is an instance of Error Constructor", () => {
  const inputStatusCode = 500;

  const testErr = new IntentionalError(inputMessage, inputStatusCode);

  expect(testErr).toBeInstanceOf(Error);
});

it("doesn't throw exception when instanciated with valid statusCode (400-599 including)", () => {
  const validStatusCode1 = 400;
  const validStatusCode2 = 599;

  const testFn1 = () => new IntentionalError(inputMessage, validStatusCode1);
  const testFn2 = () => new IntentionalError(inputMessage, validStatusCode2);

  expect(testFn1).not.toThrow();
  expect(testFn2).not.toThrow();
});

it(`throws exception when instanciated with invalid statusCode`, () => {
  const invalidStatusCode1 = 600;
  const invalidStatusCode2 = 399;

  const expectedErrRegExp = /statusCode valid range: 400-599/;

  const testFn1 = () => new IntentionalError(inputMessage, invalidStatusCode1);
  const testFn2 = () => new IntentionalError(inputMessage, invalidStatusCode2);

  expect(testFn1).toThrow(expectedErrRegExp);
  expect(testFn2).toThrow(expectedErrRegExp);
});
