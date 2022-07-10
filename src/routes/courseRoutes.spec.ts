// PACAKGES
import path from "path";
import fs from "fs";
import { describe, vi, it, expect, afterEach, test } from "vitest";
import request from "supertest";

// PROJECT_MODULES
import Course, { CourseType } from "../models/courseModel";
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
  process.env.NODE_ENV = "development";

  vi.clearAllMocks();
});

// MOCKS

vi.mock("../models/courseModel", () => ({
  default: {
    find: () => {},
    findById: vi.fn(
      (courseId: string) =>
        new Promise((resolve, _reject) => {
          const course = COURSES_MOCK.find(course => (course._id as any) === courseId);

          course ? resolve(course) : resolve(null);
        })
    ),
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

    it("fetches all courses / responds with expected headers && body", async () => {
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

describe(`${COURSES_URL}/:id`, () => {
  describe("GET", () => {
    it("invokes Course.findById() with id param as argument", async () => {
      const inputId = "test-id";

      await request(app).get(`${COURSES_URL}/${inputId}`);

      expect(Course.findById).toBeCalledWith(inputId);
    });

    test("when id-param has a course match, it responds with expected headers && body", async () => {
      const inputIdWithMatch = COURSES_MOCK[0]._id;
      const expectedCourse = COURSES_MOCK.find(course => course._id === inputIdWithMatch);
      const expectedResBody = {
        status: "success",
        message: `successfully fetched course with id: ${inputIdWithMatch}`,
        course: expectedCourse,
      };

      const { body } = await request(app)
        .get(`${COURSES_URL}/${inputIdWithMatch}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(body).toEqual(expectedResBody);
    });

    it("handles case when there's no course match for id-param (in production)", async () => {
      const courseIdWithoutMatch = "1234567890";
      const expectedResBody = {
        status: "fail",
        message: `course with id: ${courseIdWithoutMatch} does not exist`,
      };

      process.env.NODE_ENV = "production";
      const { body } = await request(app)
        .get(`${COURSES_URL}/${courseIdWithoutMatch}`)
        .expect(404)
        .expect("Content-Type", /json/);

      expect(body).toEqual(expectedResBody);
    });
  });
});
