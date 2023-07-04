// PACKAGES
import { it, expect } from "vitest";

// MODULES
import { IntentionalError } from "./intentionalError";

const inputMessage = "input message";

it.concurrent("instantiated holds expected properties", () => {
  const inputStatusCode = 500;
  const expectedProperties = new Map();
  expectedProperties.set("message", inputMessage);
  expectedProperties.set("statusCode", inputStatusCode);
  expectedProperties.set("status", "error");
  expectedProperties.set("isIntentional", true);

  const testErr = new IntentionalError(inputMessage, inputStatusCode);

  expectedProperties.forEach((value, key) => {
    expect(testErr).toHaveProperty(key);
    expect(testErr[key]).toBe(value);
  });

  expect(testErr).toHaveProperty("stack");
});

it.concurrent("correctly generates status property based on statusCode argument", () => {
  const [inputStatusCode1, inputStatusCode2] = [400, 500];
  const [expectedStatus1, expectedStatus2] = ["fail", "error"];

  const testErr1 = new IntentionalError(inputMessage, inputStatusCode1);
  const testErr2 = new IntentionalError(inputMessage, inputStatusCode2);

  expect(testErr1.status).toBe(expectedStatus1);
  expect(testErr2.status).toBe(expectedStatus2);
});

it.concurrent("is an instance of 'Error()' constructor", () => {
  const inputStatusCode = 500;

  const testErr = new IntentionalError(inputMessage, inputStatusCode);

  expect(testErr).toBeInstanceOf(Error);
});

it.concurrent(`raises exception when instantiated with invalid statusCode`, () => {
  const invalidStatusCode1 = 600;
  const invalidStatusCode2 = 399;
  const expectedErrMessage = /statusCode: '.*' is invalid/;

  const testFn1 = () => new IntentionalError(inputMessage, invalidStatusCode1);
  const testFn2 = () => new IntentionalError(inputMessage, invalidStatusCode2);

  expect(testFn1).toThrow(expectedErrMessage);
  expect(testFn2).toThrow(expectedErrMessage);
});
