// PACKAGES
import path from "path";
import fs from "fs";
import { it, expect, describe, vi, afterEach, Mocked } from "vitest";
import request from "supertest";
import app from "../app";

// MODULES
import Bootcamp, { IBootcamp } from "../models/bootcampModel";
import { BOOTCAMPS_URL, EARTH_RADIUS_KM } from "../constants";
import { geocoder } from "../utils";

// CONSTANTS
type MockBootcamp = Omit<IBootcamp, "_id"> & { _id: string };
const MOCK_BOOTCAMPS_PATH = path.join(__dirname, "../../mock_data/bootcamps.json");
const MOCK_BOOTCAMPS: MockBootcamp[] = JSON.parse(fs.readFileSync(MOCK_BOOTCAMPS_PATH, "utf-8"));

// MOCKS

vi.mock("../models/bootcampModel", () => ({
  default: {
    find: vi.fn(() => Promise.resolve(MOCK_BOOTCAMPS)),
    create: vi.fn((bootcamp: object) => Promise.resolve(bootcamp)),
    findById: vi.fn(
      (id: string) =>
        new Promise(resolve => {
          const bootcamp = MOCK_BOOTCAMPS.find(bootcamp => bootcamp._id === id);
          bootcamp ? resolve(bootcamp) : resolve(null);
        })
    ),
    findByIdAndUpdate: vi.fn(
      (id: string, bootcampUpdate: object, config: { new: boolean }) =>
        new Promise(resolve => {
          const bootcamp = MOCK_BOOTCAMPS.find(bootcamp => bootcamp._id === id);

          if (!bootcamp) {
            resolve(null);
            return;
          }

          const updatedBootcamp = { ...bootcamp, ...bootcampUpdate };

          config.new === true ? resolve(updatedBootcamp) : resolve(bootcamp);
        })
    ),
    findByIdAndDelete: vi.fn(
      (id: string) =>
        new Promise(resolve => {
          const bootcamp = MOCK_BOOTCAMPS.find(bootcamp => bootcamp._id === id);
          bootcamp ? resolve(bootcamp) : resolve(null);
        })
    ),
  },
}));

const featureQueryExecuteSpy = vi.fn(() => Promise.resolve<unknown>(MOCK_BOOTCAMPS));
const featureQueryAddAllFeaturesSpy = vi.fn();

vi.mock("../utils/featureQuery", () => ({
  FeatureQuery: class {
    execute() {
      return featureQueryExecuteSpy();
    }

    addAllFeatures() {
      featureQueryAddAllFeaturesSpy.mockImplementation(() => this);
      return featureQueryAddAllFeaturesSpy();
    }
  },
}));

vi.mock("../utils/geocoder", () => ({
  geocoder: {
    geocode: vi.fn(() => Promise.resolve([{ longitude: 10, latitude: 10 }])),
  },
}));

const mockedBootcamp = Bootcamp as Mocked<typeof Bootcamp>;
const mockedGeocoder = geocoder as Mocked<typeof geocoder>;

// HOOKS

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

// TEST SUITES

describe(`POST ${BOOTCAMPS_URL}`, () => {
  const inputReqBody = MOCK_BOOTCAMPS[0];

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

describe(`GET ${BOOTCAMPS_URL}`, () => {
  it("responds with expected headers and body", async () => {
    const expectedBootcamps = MOCK_BOOTCAMPS;
    const expectedResBody = {
      status: "success",
      message: "successfully fetched bootcamps",
      count: expectedBootcamps.length,
      bootcamps: expectedBootcamps,
    };

    const { body } = await request(app).get(BOOTCAMPS_URL).expect(200).expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });

  it("responds with bootcamps comming from FeatureQuery.execute()", async () => {
    const executionPromiseValue = "test value";
    featureQueryExecuteSpy.mockImplementationOnce(() => Promise.resolve(executionPromiseValue));

    const {
      body: { bootcamps },
    } = await request(app).get(BOOTCAMPS_URL);

    expect(bootcamps).toBe(executionPromiseValue);
  });

  it("invokes FeatureQuery.addAllFeatures() (ensuring it's applying all query features)", async () => {
    await request(app).get(BOOTCAMPS_URL);

    expect(featureQueryAddAllFeaturesSpy).toBeCalled();
  });
});

describe(`GET ${BOOTCAMPS_URL}/:id`, () => {
  it("invokes Bootcamp.findById() method with id argument", async () => {
    const inputId = "input id";

    await request(app).get(`${BOOTCAMPS_URL}/${inputId}`);

    expect(Bootcamp.findById).toBeCalledWith(inputId);
  });

  it("responds with expected headers and body when there's a bootcamp id match", async () => {
    const expectedBootcamp = MOCK_BOOTCAMPS[0];
    const inputBootcampId = expectedBootcamp._id;
    const expectedResBody = {
      status: "success",
      message: `successfully fetched bootcamp with id: '${inputBootcampId}'`,
      bootcamp: expectedBootcamp,
    };

    const { body } = await request(app)
      .get(`${BOOTCAMPS_URL}/${inputBootcampId}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });

  it("production - responds with expected headers and body when there's no bootcamp id match", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputBootcampId = "no match id";
    const expectedResBody = {
      status: "fail",
      message: `bootcamp with id: '${inputBootcampId}' doesn't exist`,
    };

    const { body } = await request(app)
      .get(`${BOOTCAMPS_URL}/${inputBootcampId}`)
      .expect(404)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });
});

describe(`PATCH ${BOOTCAMPS_URL}/:id`, () => {
  it("invokes Bootcamp.findByIdAndUpdate() method with expected arguments", async () => {
    const inputBootcampId = "12345";
    const inputBootcampUpdate = { name: "new bootcamp name" };
    const expectedConfigObj = { new: true, runValidators: true };
    const expectedArgs = [inputBootcampId, inputBootcampUpdate, expectedConfigObj];

    await request(app).patch(`${BOOTCAMPS_URL}/${inputBootcampId}`).send(inputBootcampUpdate);

    expect(Bootcamp.findByIdAndUpdate).toBeCalledWith(...expectedArgs);
  });

  it("responds with expected headers and body when there's a bootcamp id match", async () => {
    const inputBootcampId = MOCK_BOOTCAMPS[0]._id;
    const inputBootcampUpdate = { name: "new bootcamp name" };
    const expectedUpdatedBootcamp = {
      ...MOCK_BOOTCAMPS.find(bootcamp => bootcamp._id === inputBootcampId),
      ...inputBootcampUpdate,
    };
    const expectedResBody = {
      status: "success",
      message: `successfully updated bootcamp with id: '${inputBootcampId}'`,
      updatedBootcamp: expectedUpdatedBootcamp,
    };

    const { body } = await request(app)
      .patch(`${BOOTCAMPS_URL}/${inputBootcampId}`)
      .send(inputBootcampUpdate)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });

  it("production - responds with expected headers and body when there's no bootcamp id match", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputBootcampId = "no match id";
    const expectedResBody = {
      status: "fail",
      message: `bootcamp with id: '${inputBootcampId}' doesn't exist`,
    };

    const { body } = await request(app)
      .patch(`${BOOTCAMPS_URL}/${inputBootcampId}`)
      .expect(404)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });
});

describe(`DELETE ${BOOTCAMPS_URL}`, () => {
  it("invokes Bootcamp.findByIdAndDelete() method with id argument", async () => {
    const inputId = "input id";

    await request(app).delete(`${BOOTCAMPS_URL}/${inputId}`);

    expect(Bootcamp.findByIdAndDelete).toBeCalledWith(inputId);
  });

  it("responds with 204 status code when there's a bootcamp id match", async () => {
    const inputBootcampId = MOCK_BOOTCAMPS[0]._id;

    await request(app).delete(`${BOOTCAMPS_URL}/${inputBootcampId}`).expect(204);
  });

  it("production - responds with expected headers and body when there's no bootcamp id match", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputBootcampId = "no match id";
    const expectedResBody = {
      status: "fail",
      message: `bootcamp with id: '${inputBootcampId}' doesn't exist`,
    };

    const { body } = await request(app)
      .delete(`${BOOTCAMPS_URL}/${inputBootcampId}`)
      .expect(404)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });
});

describe(`GET ${BOOTCAMPS_URL}/radius/:zipcode/:distance`, () => {
  it("invokes Bootcamp.find() method with expected arguments", async () => {
    const inputZipcode = "02118";
    const inputDistance = 10;
    const radius = inputDistance / EARTH_RADIUS_KM;
    const longitude = 5;
    const latitude = 5;
    const expectedFindArg = {
      location: { $geoWithin: { $centerSphere: [[longitude, latitude], radius] } },
    };

    mockedGeocoder.geocode.mockImplementationOnce(() => Promise.resolve([{ longitude, latitude }]));

    await request(app).get(`${BOOTCAMPS_URL}/radius/${inputZipcode}/${inputDistance}`);

    expect(Bootcamp.find).toBeCalledWith(expectedFindArg);
  });

  it("invokes geocoder.geocode() method with zipcode param", async () => {
    const inputZipcode = "02118";
    const inputDistance = 10;

    await request(app).get(`${BOOTCAMPS_URL}/radius/${inputZipcode}/${inputDistance}`);

    expect(geocoder.geocode).toBeCalledWith(inputZipcode);
  });

  it("responds with expected headers and body", async () => {
    const inputZipcode = "02118";
    const inputDistance = 10;
    const bootcampsWithinRadius = [MOCK_BOOTCAMPS[0], MOCK_BOOTCAMPS[1], MOCK_BOOTCAMPS[2]]; // arbitrarily chosen list
    const expectedResBody = {
      status: "success",
      count: bootcampsWithinRadius.length,
      bootcamps: bootcampsWithinRadius,
    };

    mockedBootcamp.find.mockImplementationOnce(() => Promise.resolve<any>(bootcampsWithinRadius));

    const { body } = await request(app)
      .get(`${BOOTCAMPS_URL}/radius/${inputZipcode}/${inputDistance}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });

  it("production - responds with expected headers and body when distance param is invalid", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputZipcode = "02118";
    const inputDistance = "invalid distance";
    const expectedResBody = {
      status: "fail",
      message: `invalid distance: '${inputDistance}'`,
    };

    const { body } = await request(app)
      .get(`${BOOTCAMPS_URL}/radius/${inputZipcode}/${inputDistance}`)
      .expect(400)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });

  it("production - responds with expected headers and body when geocoder fails to locate zipcode param", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const inputZipcode = "non existant zipcode";
    const inputDistance = 10;
    const expectedResBody = {
      status: "fail",
      message: `zipcode: '${inputZipcode}' not found`,
    };

    // simulate geocoder not finding zipcode location
    mockedGeocoder.geocode.mockImplementationOnce(() => Promise.resolve([]));

    const { body } = await request(app)
      .get(`${BOOTCAMPS_URL}/radius/${inputZipcode}/${inputDistance}`)
      .expect(400)
      .expect("Content-Type", /json/);

    expect(body).toEqual(expectedResBody);
  });
});
