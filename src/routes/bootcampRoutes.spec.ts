// PACKAGES
import fs from "fs";
import path from "path";
import { describe, vi, it, afterEach, expect, test } from "vitest";
import request from "supertest";

// PROJECT_MODULES
import Bootcamp, { BootcampType } from "../models/bootcampModel";
import { CourseType } from "../models/courseModel";
import { BOOTCAMPS_URL } from "../constants";
import app from "../app";
import { getEnvVar } from "../utils";

// Testing individual end-points instead of controllers

// HOOKS

afterEach(() => {
  process.env.NODE_ENV = "development";

  vi.clearAllMocks();
});

// MOCKS

const BOOTCAMPS_MOCK_PATH = path.join(__dirname, "../../mock_data/bootcamps.json");
const BOOTCAMPS_MOCK: BootcampType[] = JSON.parse(fs.readFileSync(BOOTCAMPS_MOCK_PATH, "utf-8"));

const COURSES_MOCK_PATH = path.join(__dirname, "../../mock_data/courses.json");
const COURSES_MOCK: CourseType[] = JSON.parse(fs.readFileSync(COURSES_MOCK_PATH, "utf-8"));

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
    findById: vi.fn(
      (bootcampId: string) =>
        new Promise((resolve, _reject) => {
          const bootcamp = BOOTCAMPS_MOCK.find(bootcamp => (bootcamp._id as any) === bootcampId);

          bootcamp ? resolve(bootcamp) : resolve(null);
        })
    ),
    findByIdAndDelete: vi.fn(
      (bootcampId: string) =>
        new Promise((resolve, _reject) => {
          const bootcamp = BOOTCAMPS_MOCK.find(({ _id }) => (_id as any) === bootcampId);

          bootcamp ? resolve(bootcamp) : resolve(undefined);
        })
    ),
  },
}));

const populateSpy = vi.fn(() => getBootcampsPopulatedWithCourses());

vi.mock("../utils/apiFeatures", () => ({
  default: class {
    allFeatures() {
      return {
        populate: populateSpy,
      };
    }
  },
}));

// HELPER FUNCTIONS

function getBootcampsPopulatedWithCourses() {
  // O(n^2) quadratic time complexity so be careful with sample size
  const bootcamps = BOOTCAMPS_MOCK.map(bootcamp => {
    const courses = COURSES_MOCK.filter(course => bootcamp._id === course.bootcamp);

    return { ...bootcamp, courses };
  });

  return bootcamps;
}

// TESTS

describe(BOOTCAMPS_URL, () => {
  describe("GET", () => {
    it("responds with expected headers && body", async () => {
      const expectedBootcamps = getBootcampsPopulatedWithCourses();
      const expectedResBody = {
        status: "success",
        message: "successfully fetched bootcamps",
        count: expectedBootcamps.length,
        bootcamps: expectedBootcamps,
      };

      const { body } = await request(app).get(BOOTCAMPS_URL).expect(200).expect("Content-Type", /json/);

      expect(body).toEqual(expectedResBody);
    });

    it("invokes: 'new ApiFeatures().allFeatures().populate()' with expected arguments (ensuring it's populating bootcamps with courses)", async () => {
      const expectedPopulateArg = "courses";

      await request(app).get(BOOTCAMPS_URL);

      expect(populateSpy).toBeCalledWith(expectedPopulateArg);
    });

    it("responds with bootcamps comming from: 'new ApiFeatuers.allFeatures().populate()' (ensuring it's implementing all API features)", async () => {
      // ensure bootcamps are comming from allFeatures() by checking whether end-point responds with "test value" as bootcamps
      const expectedBootcampsValue = "test value";
      (populateSpy as any).mockImplementationOnce(() => Promise.resolve(expectedBootcampsValue));

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

  describe("GET", () => {
    it("invokes Bootcamp.findById method with id param as argument", async () => {
      const inputId = "input-id";

      await request(app).get(`${BOOTCAMPS_URL}/${inputId}`);

      expect(Bootcamp.findById).toBeCalledWith(inputId);
    });

    test("when id-param has a bootcamp match, it responds with expected headers && body", async () => {
      const inputBootcampIdWithMatch = BOOTCAMPS_MOCK[0]._id;
      const expectedResBody = {
        status: "success",
        message: `successfully fetched bootcamp with id: ${inputBootcampIdWithMatch}`,
        bootcamp: BOOTCAMPS_MOCK.find(({ _id }) => _id === inputBootcampIdWithMatch),
      };

      const { body } = await request(app)
        .get(`${BOOTCAMPS_URL}/${inputBootcampIdWithMatch}`)
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
        .get(`${BOOTCAMPS_URL}/${bootcampIdWithoutMatch}`)
        .expect(404)
        .expect("Content-Type", /json/);

      expect(body).toEqual(expectedResBody);
    });
  });

  describe("DELETE", () => {
    it("invokes Bootcamp.findByIdAndDelete method with id param", async () => {
      const inputId = "input-id";

      await request(app).delete(`${BOOTCAMPS_URL}/${inputId}`);

      expect(Bootcamp.findByIdAndDelete).toBeCalledWith(inputId);
    });

    test("when id-param has a bootcamp match it responds with 204 status code", async () => {
      const inputBootcampId = BOOTCAMPS_MOCK[0]._id;

      await request(app).delete(`${BOOTCAMPS_URL}/${inputBootcampId}`).expect(204);
    });

    it("handles case when there's no bootcamp match for id param (in production)", async () => {
      const bootcampIdWithoutMatch = "1234567890";
      const expectedResBody = {
        status: "fail",
        message: `bootcamp with id: ${bootcampIdWithoutMatch} does not exist`,
      };

      process.env.NODE_ENV = "production";
      const { body } = await request(app)
        .delete(`${BOOTCAMPS_URL}/${bootcampIdWithoutMatch}`)
        .expect(404)
        .expect("Content-Type", /json/);

      expect(body).toEqual(expectedResBody);
    });
  });
});

const geocodeSpy = vi.fn(() => Promise.resolve([{ longitude: 1, latitude: 1 }]));

vi.mock("../utils/geocoder", () => ({
  default: {
    geocode: () => geocodeSpy(),
  },
}));

describe(`GET ${BOOTCAMPS_URL}/radius/:zipcode/:distance`, () => {
  // thanks to this test later down the line I can mock away the find method (without implementing the actual logic...) because I already tested that it get's inovoked with expected arguments
  it("invokes Bootcamp.find method with expected arguments", async () => {
    const inputZipcode = "02118";
    const inputDistance = 10;
    const radius = inputDistance / Number(getEnvVar("EARTH_RADIUS_KM"));

    const testLongitude = 5;
    const testLatitude = 5;
    geocodeSpy.mockImplementationOnce(() =>
      Promise.resolve([{ longitude: testLongitude, latitude: testLatitude }])
    );

    const expectedFindArg = {
      location: { $geoWithin: { $centerSphere: [[testLongitude, testLatitude], radius] } },
    };

    await request(app).get(`${BOOTCAMPS_URL}/radius/${inputZipcode}/${inputDistance}`);

    expect(Bootcamp.find).toBeCalledWith(expectedFindArg);
  });

  it("when there are bootcamps within radius, responds with expected headers && body", async () => {
    const inputZipcode = "02118";
    const inputDistanceKm = 100;
    // list of random bootcamps for faking bootcampsWithinRadius
    const testBootcampsWithinRadius = new Array(BOOTCAMPS_MOCK[0], BOOTCAMPS_MOCK[1], BOOTCAMPS_MOCK[2]);

    const expectedResBody = {
      status: "success",
      count: testBootcampsWithinRadius.length,
      bootcamps: testBootcampsWithinRadius,
    };

    (Bootcamp.find as any).mockImplementationOnce(() => Promise.resolve(testBootcampsWithinRadius));

    const { body } = await request(app)
      .get(`${BOOTCAMPS_URL}/radius/${inputZipcode}/${inputDistanceKm}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });

  it("when there are no bootcamps within radius, responds with generic success body", async () => {
    const inputZipcode = "02118";
    const inputDistanceKm = 15;
    const expectedResBody = {
      status: "success",
      count: 0,
      bootcamps: [],
    };

    // simulate situation where there's no bootcamps within radius
    (Bootcamp.find as any).mockImplementationOnce(() => Promise.resolve([]));

    const { body } = await request(app)
      .get(`${BOOTCAMPS_URL}/radius/${inputZipcode}/${inputDistanceKm}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });
});
