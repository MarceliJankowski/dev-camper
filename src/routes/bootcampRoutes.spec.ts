// PACKAGES
import fs from "fs";
import path from "path";
import { describe, vi, it, afterEach, expect } from "vitest";
import request from "supertest";

// PROJECT_MODULES
import Bootcamp, { BootcampType } from "../models/bootcampModel";
import { BOOTCAMPS_URL } from "../constants";
import app from "../app";

// Testing individual end-points instead of controllers

const BOOTCAMPS_MOCK_PATH = path.join(__dirname, "../../mock_data/bootcamps.json");
const BOOTCAMPS_MOCK: BootcampType[] = JSON.parse(fs.readFileSync(BOOTCAMPS_MOCK_PATH, "utf-8"));

afterEach(() => {
  process.env.NODE_ENV = "development";

  vi.clearAllMocks();
});

vi.mock("../models/bootcampModel", () => ({
  default: {
    find: vi.fn(() => Promise.resolve(BOOTCAMPS_MOCK)),
    create: vi.fn((bootcamp: object) => Promise.resolve(bootcamp)),
  },
}));

const allFeaturesSpy = vi.fn();

vi.mock("../utils/apiFeatures", () => ({
  default: class {
    allFeatures() {
      return allFeaturesSpy();
    }
  },
}));

describe(BOOTCAMPS_URL, () => {
  describe("GET", () => {
    it("fetches all bootcamps / responds with expected headers && body", async () => {
      allFeaturesSpy.mockImplementationOnce(() => Promise.resolve(BOOTCAMPS_MOCK));
      const expectedResBody = {
        status: "success",
        message: "successfully fetched bootcamps",
        count: BOOTCAMPS_MOCK.length,
        bootcamps: BOOTCAMPS_MOCK,
      };

      const { body } = await request(app).get(BOOTCAMPS_URL).expect(200).expect("Content-Type", /json/);

      expect(body).toEqual(expectedResBody);
    });

    it("responds with bootcamps comming from: 'new ApiFeatuers.allFeatures()' (ensuring it's implementing all API features)", async () => {
      // ensure bootcamps are comming from allFeatures() by checking whether end-point responds with "test value" as bootcamps
      const expectedBootcampsValue = "test value";
      allFeaturesSpy.mockImplementationOnce(() => Promise.resolve(expectedBootcampsValue));

      const {
        body: { bootcamps },
      } = await request(app).get(BOOTCAMPS_URL).expect(200).expect("Content-Type", /json/);

      expect(bootcamps).toBe(expectedBootcampsValue);
    });
  });

  describe("POST", () => {
    const inputReqBody = BOOTCAMPS_MOCK[0];

    it("responds with expected headers && body", async () => {
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

    it("invokes Bootcamp.create method with req.body as argument", async () => {
      await request(app).post(BOOTCAMPS_URL).send(inputReqBody);

      expect(Bootcamp.create).toBeCalledWith(inputReqBody);
    });
  });
});
