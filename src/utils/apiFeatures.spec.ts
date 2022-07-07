// PACKAGES
import { describe, it, expect, vi, test, afterEach } from "vitest";

// PROJECT_MODULES
import ApiFeatures, { QueryObject } from "./apiFeatures";

const CURSOR_MOCK: any = {
  skip: vi.fn(() => CURSOR_MOCK),
  limit: vi.fn(() => CURSOR_MOCK),
  find: vi.fn(),
  transform: vi.fn(),
  paginate: vi.fn(),
  sort: vi.fn(),
  project: vi.fn(),
  select: vi.fn(),
};

const INPUT_QUERY: QueryObject = {};

afterEach(() => {
  vi.clearAllMocks();
});

describe("transform()", () => {
  it("invokes cursor.find() with transformed queryObj, where [page, sort, limit, fields] are excluded", () => {
    const inputQuery: QueryObject = {
      sort: "-name",
      fields: "-createdAt,-__v",
      limit: "5",
      page: "1",
    };

    const expectedFindArg = {};

    new ApiFeatures(CURSOR_MOCK, inputQuery).transform();

    expect(CURSOR_MOCK.find).toBeCalledWith(expectedFindArg);
  });

  it("invokes cursor.find() with transformed queryObj, where mongodb operators: [gt, lt, gte, lte, in] are preceded by '$' (enabling them)", () => {
    const inputQuery: QueryObject = {
      a: { gt: 5000 },
      b: { gte: 5000 },
      c: { lt: 5000 },
      d: { lte: 5000 },
      e: { in: 5000 },
    };

    const expectedFindArg = JSON.parse(
      JSON.stringify(inputQuery).replace(/\b(?:gt|gte|lt|lte|in)\b/g, match => "$" + match)
    );

    new ApiFeatures(CURSOR_MOCK, inputQuery).transform();

    expect(CURSOR_MOCK.find).toBeCalledWith(expectedFindArg);
  });
});

describe("sort()", () => {
  it("when query.sort is present it replaces comas with spaces (expected format by mongoose) and invokes cursor.sort() with it", () => {
    const inputQuery: QueryObject = {
      sort: "name,-createdAt",
    };

    const expectedSortArg = inputQuery.sort.replace(RegExp(",", "g"), " ");

    new ApiFeatures(CURSOR_MOCK, inputQuery).sort();

    expect(CURSOR_MOCK.sort).toBeCalledWith(expectedSortArg);
  });

  it("when query.sort is not present it invokes cursor.sort() with '-createdAt'", () => {
    const expectedSortArg = "-createdAt";

    new ApiFeatures(CURSOR_MOCK, INPUT_QUERY).sort();

    expect(CURSOR_MOCK.sort).toBeCalledWith(expectedSortArg);
  });
});

describe("paginate()", () => {
  it("when query.limit is not present it invokes cursor.limit() with 10", () => {
    const expectedLimitArg = 10;

    new ApiFeatures(CURSOR_MOCK, INPUT_QUERY).paginate();

    expect(CURSOR_MOCK.limit).toBeCalledWith(expectedLimitArg);
  });

  it("when query.page is not present it invokes cursor.skip() with 0", () => {
    const expectedSkipArg = 0;

    new ApiFeatures(CURSOR_MOCK, INPUT_QUERY).paginate();

    expect(CURSOR_MOCK.skip).toBeCalledWith(expectedSkipArg);
  });

  it("invokes cursor.skip() && cursor.limit() based on query.limit && query.page when present", () => {
    const inputQuery: QueryObject = {
      page: "2",
      limit: "5",
    };

    const expectedLimitArg = Number(inputQuery.limit);
    const expectedSkipArg = (Number(inputQuery.page) - 1) * expectedLimitArg;

    new ApiFeatures(CURSOR_MOCK, inputQuery).paginate();

    expect(CURSOR_MOCK.limit).toBeCalledWith(expectedLimitArg);
    expect(CURSOR_MOCK.skip).toBeCalledWith(expectedSkipArg);
  });
});

describe("project()", () => {
  it("when query.fields is present it replaces comas with spaces (expected format by mongoose) and invokes cursor.select() with parsed fields", () => {
    const inputQuery: QueryObject = {
      fields: "name,createdAt",
    };
    const expectedSelectArg = inputQuery.fields.replace(RegExp(",", "g"), " ");

    new ApiFeatures(CURSOR_MOCK, inputQuery).project();

    expect(CURSOR_MOCK.select).toBeCalledWith(expectedSelectArg);
  });

  it("when query.fields is not present it invokes cursor.select() with '-__v' default value", () => {
    const expectedSelectArg = "-__v";

    new ApiFeatures(CURSOR_MOCK, INPUT_QUERY).project();

    expect(CURSOR_MOCK.select).toBeCalledWith(expectedSelectArg);
  });
});

test("allFeatures() invokes all ApiFeatures methods without passing any arguments (ensures that default parameters are used)", () => {
  const apiFeaturesInstance = new ApiFeatures(CURSOR_MOCK, INPUT_QUERY);
  const returnApiFeaturesInstance = () => apiFeaturesInstance;

  apiFeaturesInstance.transform = vi.fn(returnApiFeaturesInstance);
  apiFeaturesInstance.paginate = vi.fn(returnApiFeaturesInstance);
  apiFeaturesInstance.project = vi.fn(returnApiFeaturesInstance);
  apiFeaturesInstance.sort = vi.fn(returnApiFeaturesInstance);

  apiFeaturesInstance.allFeatures();

  expect(apiFeaturesInstance.transform).toBeCalledWith();
  expect(apiFeaturesInstance.paginate).toBeCalledWith();
  expect(apiFeaturesInstance.project).toBeCalledWith();
  expect(apiFeaturesInstance.sort).toBeCalledWith();
});
