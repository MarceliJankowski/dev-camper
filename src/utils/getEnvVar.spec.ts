import { afterEach, it, expect } from "vitest";
import getEnvVar from "./getEnvVar";

const testEnvVarName = "test";

afterEach(() => {
  process.env = {};
});

it("retrieves env variable when present on process object", () => {
  const testEnvVarValue = "tomatoes are red while cucumbers are green";
  process.env[testEnvVarName] = testEnvVarValue;

  const outputEnvVar = getEnvVar(testEnvVarName);

  expect(outputEnvVar).toBe(testEnvVarValue);
});

it("throws exception when env variable is not defined", () => {
  const outputFn = () => getEnvVar(testEnvVarName);

  expect(outputFn).toThrow();
});
