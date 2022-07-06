// PACKAGES
import { describe, it, expect } from "vitest";
import request from "supertest";

// PROJECT_MODULES
import { BOOTCAMPS_URL } from "../constants";
import app from "../app";

describe(BOOTCAMPS_URL, () => {
  it(`GET -> responses with expected body && headers`, async () => {
    const expectedResBody = {
      status: "success",
      message: "successfully fetched bootcamps",
    };

    const { body } = await request(app).get(BOOTCAMPS_URL).expect(200).expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });
});
