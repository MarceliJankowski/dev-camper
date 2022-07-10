// PACAKGES
import path from "path";
import fs from "fs";
import { describe, vi, it, expect, afterEach } from "vitest";
import request from "supertest";

// PROJECT_MODULES
import { CourseType } from "../models/courseModel";
import { BootcampType } from "../models/bootcampModel";
import { COURSES_URL } from "../constants";
import app from "../app";

// Testing individual end-points instead of controllers

// MOCK DATA

const COURSES_MOCK_PATH = path.join(__dirname, "../../mock_data/courses.json");
const COURSES_MOCK: CourseType[] = JSON.parse(fs.readFileSync(COURSES_MOCK_PATH, "utf-8"));

const BOOTCAMPS_MOCK_PATH = path.join(__dirname, "../../mock_data/bootcamps.json");
const BOOTCAMPS_MOCK: BootcampType[] = JSON.parse(fs.readFileSync(BOOTCAMPS_MOCK_PATH, "utf-8"));

// HOOKS

afterEach(() => {
  vi.clearAllMocks();
});

// MOCKS

vi.mock("../models/courseModel", () => ({
  default: {
    find: () => {},
  },
}));

const populateSpy = vi.fn(() => Promise.resolve(getCoursesPopulatedWithBootcamps()));

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

function getCoursesPopulatedWithBootcamps() {
  // O(n^2) quadratic time complexity so be careful with sample size
  const courses = COURSES_MOCK.map(course => {
    const { name, description, _id } = BOOTCAMPS_MOCK.find(({ _id }) => _id === course.bootcamp);

    return { ...course, bootcamp: { name, description, _id } };
  });

  return courses;
}

// TESTS

describe(COURSES_URL, () => {
  describe("GET", () => {
    it("invokes: 'new ApiFeatures.allFeatures().populate()' with expected arguments (ensuring it's populating courses with bootcamp data)", async () => {
      const expectedPopulateArg = { path: "bootcamp", select: "name description" };

      await request(app).get(COURSES_URL);

      expect(populateSpy).toBeCalledWith(expectedPopulateArg);
    });

    it("responds with courses comming from: 'new ApiFeatures.allFeatures().populate()' (ensuring it's implementing all API features)", async () => {
      // ensure courses are comming from allFeatures() by checking whether end-point responds with "test value" as courses
      const expectedCoursesValue = "test value";
      (populateSpy as any).mockImplementationOnce(() => Promise.resolve(expectedCoursesValue));

      const {
        body: { courses },
      } = await request(app).get(COURSES_URL);

      expect(courses).toBe(expectedCoursesValue);
    });

    it("responds with expected headers && body", async () => {
      const expectedCourses = getCoursesPopulatedWithBootcamps();
      const expectedResBody = {
        status: "success",
        message: "successfully fetched courses",
        count: expectedCourses.length,
        courses: expectedCourses,
      };

      const { body } = await request(app).get(COURSES_URL).expect(200).expect("Content-Type", /json/);

      expect(body).toEqual(expectedResBody);
    });
  });
});
