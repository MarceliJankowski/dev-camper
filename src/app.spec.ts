// PACKAGES
import { describe, it, expect } from "vitest";
import request from "supertest";

// MODULES
import app from "./app";

describe("GET /health", () => {
  it("responds with expected headers and body", async () => {
    const { body } = await request(app).get("/health").expect(200).expect("Content-Type", /json/);

    expect(body.status).toBe("OK");
  });
});
