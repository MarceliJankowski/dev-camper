// PACKAGES
import { it, vi, expect, afterEach } from "vitest";

// MODULES
import { getEnvVar } from "./getEnvVar";

afterEach(() => {
  vi.unstubAllEnvs();
});

const envVarName = "GET_ENV_VAR_TEST";

it("successfuly retrieves env variable (when present)", () => {
  const expectedValue = "test";
  vi.stubEnv(envVarName, expectedValue);

  const value = getEnvVar(envVarName);

  expect(value).toBe(expectedValue);
});

it("raises exception when env variable is undefined", () => {
  const wrapperFn = () => getEnvVar(envVarName);

  expect(wrapperFn).toThrowError(/variable is undefined/);
});
