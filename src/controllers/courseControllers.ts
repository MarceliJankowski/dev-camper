// PROJECT_MODULES
import { ApiFeatures, catchPromiseRej } from "../utils";
import Course from "../models/courseModel";

/**@route GET $API_V1/courses -> all courses
@access public*/
export const getCourses = catchPromiseRej(async ({ query }, res) => {
  const courseCursor = Course.find();
  const courses = await new ApiFeatures(courseCursor, query).allFeatures().populate({
    path: "bootcamp",
    select: "name description",
  });
  const courseCount = courses.length;

  res.status(200).json({
    status: "success",
    message: "successfully fetched courses",
    count: courseCount,
    courses,
  });
});
