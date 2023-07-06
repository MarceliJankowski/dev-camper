// PACKAGES
import { it, expect, describe, vi, afterEach } from "vitest";
import request from "supertest";

// MODULES
import Bootcamp from "../models/bootcampModel";
import { BOOTCAMPS_URL } from "../constants";
import app from "../app";

vi.mock("../models/bootcampModel", () => ({
  default: {
    create: vi.fn((bootcamp: object) => Promise.resolve(bootcamp)),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe(`POST ${BOOTCAMPS_URL}`, () => {
  const inputReqBody = { message: "fake bootcamp" };

  it("responds with expected headers and body", async () => {
    const expectedResBody = {
      status: "success",
      message: "bootcamp was successfully created",
      bootcamp: inputReqBody,
    };

    const { body } = await request(app)
      .post(BOOTCAMPS_URL)
      .send(inputReqBody)
      .expect(201)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });

  it("invokes Bootcamp.create() method with req.body argument", async () => {
    await request(app).post(BOOTCAMPS_URL).send(inputReqBody);

    expect(Bootcamp.create).toBeCalledWith(inputReqBody);
  });
});
