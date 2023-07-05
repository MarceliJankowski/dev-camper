// PACKAGES
import { describe, it, expect } from "vitest";
import request from "supertest";

// MODULES
import app from "./app";

describe("GET /health", () => {
  it("responds with expected headers and body", async () => {
    const expectedBody = {
      status: "success",
      message: "healthy",
    };

    const { body } = await request(app).get("/health").expect(200).expect("Content-Type", /json/);

    expect(body).toEqual(expectedBody);
  });
});

describe.concurrent("invalid endpoint", () => {
  const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]; // selectively choosing the most popular ones, no point in overdoing it after all
  const invalidEndpoint = `/invalid`;

  HTTP_METHODS.forEach(httpVerb => {
    it(`${httpVerb} ${invalidEndpoint} -> expected headers and body`, async () => {
      const expectedBody = {
        status: "fail",
        message: "endpoint not found",
      };

      const { body } = await request(app)
        [httpVerb.toLowerCase()](invalidEndpoint)
        .expect(404)
        .expect("Content-Type", /json/);

      expect(body).toEqual(expectedBody);
    });
  });
});
