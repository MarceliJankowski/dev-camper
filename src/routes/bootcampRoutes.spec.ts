// PACKAGES
import fs from "fs";
import path from "path";
import { describe, vi, it, afterEach, expect, test } from "vitest";
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
    findByIdAndUpdate: vi.fn(
      (bootcampId: string, bootcampUpdate: object, config: { new: boolean }) =>
        new Promise((resolve, _reject) => {
          const bootcamp = BOOTCAMPS_MOCK.find(bootcamp => (bootcamp._id as any) === bootcampId);

          if (!bootcamp) {
            resolve(undefined);
            return;
          }

          const updatedBootcamp = { ...bootcamp, ...bootcampUpdate };

          config.new === true ? resolve(updatedBootcamp) : resolve(bootcamp);
        })
    ),
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

describe(`${BOOTCAMPS_URL}/:id`, () => {
  describe("PATCH", () => {
    it("invokes Bootcamp.findByIdAndUpdate method with expected arguments", async () => {
      const inputBootcampId = "input-id";
      const inputBootcampUpdate = { name: "new bootcamp name" };
      const expectedConfigObj = { new: true, runValidators: true };
      const expectedArgs = [inputBootcampId, inputBootcampUpdate, expectedConfigObj];

      await request(app).patch(`${BOOTCAMPS_URL}/${inputBootcampId}`).send(inputBootcampUpdate);

      expect(Bootcamp.findByIdAndUpdate).toBeCalledWith(...expectedArgs);
    });

    test("when there's a bootcamp with id-param match, it responds with expected headers && body", async () => {
      const inputBootcampId = BOOTCAMPS_MOCK[0]._id;
      const inputBootcampUpdate = { name: "new bootcamp name" };
      const expectedUpdatedBootcamp = {
        ...BOOTCAMPS_MOCK.find(bootcamp => bootcamp._id === inputBootcampId),
        ...inputBootcampUpdate,
      };
      const expectedResBody = {
        status: "success",
        message: `successfully updated bootcamp with id: ${inputBootcampId}`,
        updatedBootcamp: expectedUpdatedBootcamp,
      };

      const { body } = await request(app)
        .patch(`${BOOTCAMPS_URL}/${inputBootcampId}`)
        .send(inputBootcampUpdate)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(body).toEqual(expectedResBody);
    });

    it("handles case when there's no bootcamp match for id param (in production)", async () => {
      const bootcampIdWithoutMatch = "1234567890";
      const expectedResBody = {
        status: "fail",
        message: `bootcamp with id: ${bootcampIdWithoutMatch} does not exist`,
      };

      process.env.NODE_ENV = "production";
      const { body } = await request(app)
        .patch(`${BOOTCAMPS_URL}/${bootcampIdWithoutMatch}`)
        .expect(404)
        .expect("Content-Type", /json/);

      expect(body).toEqual(expectedResBody);
    });
  });
});
