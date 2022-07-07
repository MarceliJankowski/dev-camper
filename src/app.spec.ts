// PACKAGES
import { expect, describe, test, beforeAll, afterAll } from "vitest";
import request from "supertest";

// PROJECT_MODULES
import app from "./app";
import { API_V1 } from "./constants";

describe("invalid end-point", () => {
  const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const INVALID_END_POINT = `${API_V1}/invalid`;
  const expectedStatus = "fail";
  const expectedStatusCode = 404;

  afterAll(() => {
    delete process.env.NODE_ENV;
  });

  describe("development", () => {
    beforeAll(() => {
      process.env.NODE_ENV = "development";
    });

    HTTP_METHODS.forEach(httpVerb => {
      test.concurrent(`${httpVerb} ${INVALID_END_POINT} -> invalid end-point error`, async () => {
        const expectedResBody = {
          status: expectedStatus,
          message: `invalid end-point: ${httpVerb} ${INVALID_END_POINT}`,
          error: {
            statusCode: expectedStatusCode,
            isIntentional: true,
            status: expectedStatus,
          },
        };

        const { body } = await request(app)
          [httpVerb.toLowerCase()](INVALID_END_POINT)
          .expect(expectedStatusCode)
          .expect("Content-Type", /json/);

        // assert stack property and remove it from body (for comparsion against expectedResBody)
        expect(body.stack).toMatch(RegExp(expectedResBody.message));
        delete body.stack;

        expect(body).toEqual(expectedResBody);
      });
    });
  });

  describe("production", () => {
    beforeAll(() => {
      process.env.NODE_ENV = "production";
    });

    HTTP_METHODS.forEach(httpVerb => {
      test.concurrent(`${httpVerb} ${INVALID_END_POINT} -> invalid end-point error`, async () => {
        const expectedResBody = {
          status: expectedStatus,
          message: `invalid end-point: ${httpVerb} ${INVALID_END_POINT}`,
        };

        const { body } = await request(app)
          [httpVerb.toLowerCase()](INVALID_END_POINT)
          .expect(expectedStatusCode)
          .expect("Content-Type", /json/);

        expect(body).toEqual(expectedResBody);
      });
    });
  });
});
