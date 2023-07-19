// PACKAGES
import { describe, it, expect, vi, afterEach } from "vitest";

// MODULES
import {
  FeatureQuery,
  ReqQuery,
  DEFAULT_SORT_BY,
  DEFAULT_FIELDS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
} from "./featureQuery";

afterEach(() => {
  vi.clearAllMocks();
});

const reqQueryStub: ReqQuery = {};
const cursorStub: any = {
  skip: vi.fn(() => cursorStub),
  limit: vi.fn(() => cursorStub),
  find: vi.fn(() => cursorStub),
  sort: vi.fn(() => cursorStub),
  select: vi.fn(() => cursorStub),
};

describe("addFiltering()", () => {
  it("invokes cursor.find() with updated query where: 'page', 'sort', 'limit' and 'fields' properties are disabled", () => {
    const inputQuery = {
      sort: "price",
      fields: "name",
      limit: "5",
      page: "1",
    };

    const expectedFindArg = {};

    new FeatureQuery(cursorStub, inputQuery).addFiltering();

    expect(cursorStub.find).toBeCalledWith(expectedFindArg);
  });

  it("invokes cursor.find() with updated query where: 'gt', 'lt', 'gte', 'lte' and 'in' mongo keys are recursively prefixed with '$' sign (effectively enabling them)", () => {
    const inputQuery = {
      a: { gt: "5000", nested: { lt: "300" } },
      gte: "2500",
      b: { lte: "5000", arr: [{ in: ["10", "20"] }] },
    };

    const expectedFindArg = JSON.parse(
      JSON.stringify(inputQuery).replace(/\b(?:gt|lt|gte|lte|in)\b/g, match => "$" + match)
    );

    new FeatureQuery(cursorStub, inputQuery).addFiltering();

    expect(cursorStub.find).toBeCalledWith(expectedFindArg);
  });
});

describe("addSorting()", () => {
  it("replaces query.sort comma delimiter with space (expected mongoose format) and invokes cursor.sort() with it", () => {
    const inputQuery = {
      sort: "name,-price",
    };
    const expectedSortArg = inputQuery.sort.replace(/,/g, " ");

    new FeatureQuery(cursorStub, inputQuery).addSorting();

    expect(cursorStub.sort).toBeCalledWith(expectedSortArg);
  });

  it(`when query.sort isn't a string it defaults back to '${DEFAULT_SORT_BY}' sorting method`, () => {
    const inputQuery = {
      sort: [],
    };

    new FeatureQuery(cursorStub, inputQuery).addSorting();

    expect(cursorStub.sort).toBeCalledWith(DEFAULT_SORT_BY);
  });

  it("when query.sort is undefined and 'defaultSortBy' argument is passed it invokes cursor.sort() with it", () => {
    const inputSortBy = "name";

    new FeatureQuery(cursorStub, reqQueryStub).addSorting(inputSortBy);

    expect(cursorStub.sort).toBeCalledWith(inputSortBy);
  });

  it(`when query.sort is undefined it defaults to '${DEFAULT_SORT_BY}' sorting method`, () => {
    new FeatureQuery(cursorStub, reqQueryStub).addSorting();

    expect(cursorStub.sort).toBeCalledWith(DEFAULT_SORT_BY);
  });
});

describe("addPagination()", () => {
  const DEFAULT_SKIP = (DEFAULT_PAGE - 1) * DEFAULT_LIMIT;

  it("invokes cursor.skip() and cursor.limit() methods with arguments derived from query.limit and query.page (when present)", () => {
    const inputQuery = {
      page: "2",
      limit: "5",
    };
    const expectedLimitArg = Number(inputQuery.limit);
    const expectedSkipArg = (Number(inputQuery.page) - 1) * expectedLimitArg;

    new FeatureQuery(cursorStub, inputQuery).addPagination();

    expect(cursorStub.limit).toBeCalledWith(expectedLimitArg);
    expect(cursorStub.skip).toBeCalledWith(expectedSkipArg);
  });

  it(`when query.limit isn't a string it defaults back to '${DEFAULT_LIMIT}' limit`, () => {
    const inputQuery = {
      limit: [],
    };

    new FeatureQuery(cursorStub, inputQuery).addPagination();

    expect(cursorStub.limit).toBeCalledWith(DEFAULT_LIMIT);
  });

  it("when query.limit is undefined and 'defaultLimit' argument is passed it invokes cursor.limit() with it", () => {
    const inputLimit = 5;

    new FeatureQuery(cursorStub, reqQueryStub).addPagination(inputLimit);

    expect(cursorStub.limit).toBeCalledWith(inputLimit);
  });

  it(`when query.limit is undefined it defaults limit to '${DEFAULT_LIMIT}'`, () => {
    new FeatureQuery(cursorStub, reqQueryStub).addPagination();

    expect(cursorStub.limit).toBeCalledWith(DEFAULT_LIMIT);
  });

  it(`when query.page isn't a string it defaults back to '${DEFAULT_PAGE}' page (skips ${DEFAULT_SKIP} documents)`, () => {
    const inputQuery = {
      page: [],
    };

    new FeatureQuery(cursorStub, inputQuery).addPagination();

    expect(cursorStub.skip).toBeCalledWith(DEFAULT_SKIP);
  });

  it("when query.page is undefined and 'defaultPage' argument is passed it invokes cursor.skip() based on it", () => {
    const inputPage = 2;
    const expectedSkipArg = (inputPage - 1) * DEFAULT_LIMIT;

    new FeatureQuery(cursorStub, reqQueryStub).addPagination(undefined, inputPage);

    expect(cursorStub.skip).toBeCalledWith(expectedSkipArg);
  });

  it(`when query.page is undefined it defaults page to '${DEFAULT_PAGE}' (skips ${DEFAULT_SKIP} documents)`, () => {
    new FeatureQuery(cursorStub, reqQueryStub).addPagination();

    expect(cursorStub.skip).toBeCalledWith(DEFAULT_SKIP);
  });
});

describe("addProjection()", () => {
  it("replaces query.fields comma delimiter with space (expected mongoose format) and invokes cursor.select() with it", () => {
    const inputQuery = {
      fields: "name,createdAt",
    };
    const expectedSelectArg = inputQuery.fields.replace(/,/g, " ");

    new FeatureQuery(cursorStub, inputQuery).addProjection();

    expect(cursorStub.select).toBeCalledWith(expectedSelectArg);
  });

  it(`when query.fields isn't a string it defaults back to '${DEFAULT_FIELDS}' fields`, () => {
    const inputQuery = {
      fields: [],
    };

    new FeatureQuery(cursorStub, inputQuery).addProjection();

    expect(cursorStub.select).toBeCalledWith(DEFAULT_FIELDS);
  });

  it("when query.fields is undefined and 'defaultFields' argument is passed it invokes cursor.select() with it", () => {
    const inputFields = "name";

    new FeatureQuery(cursorStub, reqQueryStub).addProjection(inputFields);

    expect(cursorStub.select).toBeCalledWith(inputFields);
  });

  it(`when query.fields is undefined it defaults projection to '${DEFAULT_FIELDS}'`, () => {
    new FeatureQuery(cursorStub, reqQueryStub).addProjection();

    expect(cursorStub.select).toBeCalledWith(DEFAULT_FIELDS);
  });
});

describe("addAllFeatures()", () => {
  it("applies all FeatureQuery features with default parameters", () => {
    const featureQuery = new FeatureQuery(cursorStub, reqQueryStub);
    featureQuery.addFiltering = vi.fn(() => featureQuery);
    featureQuery.addPagination = vi.fn(() => featureQuery);
    featureQuery.addProjection = vi.fn(() => featureQuery);
    featureQuery.addSorting = vi.fn(() => featureQuery);

    featureQuery.addAllFeatures();

    expect(featureQuery.addFiltering).toBeCalledWith();
    expect(featureQuery.addPagination).toBeCalledWith();
    expect(featureQuery.addProjection).toBeCalledWith();
    expect(featureQuery.addSorting).toBeCalledWith();
  });
});

describe("execute()", () => {
  it("returns promise with cursor results / awaits cursor", async () => {
    const resolvedCursorValue = "cursor";
    const inputCursor: any = Promise.resolve(resolvedCursorValue);

    const executionValue = await new FeatureQuery(inputCursor, reqQueryStub).execute();

    expect(executionValue).toBe(resolvedCursorValue);
  });
});
