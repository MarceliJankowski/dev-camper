// PROJECT_MODULES
import { ApiFeatures, catchPromiseRej, IntentionalError } from "../utils";
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

/**@route GET $API_V1/courses/:id
@access public*/
export const getCourse = catchPromiseRej(async ({ params: { id } }, res) => {
  const course = await Course.findById(id);

  if (!course) throw new IntentionalError(`course with id: ${id} does not exist`, 404);

  res.status(200).json({ status: "success", message: `successfully fetched course with id: ${id}`, course });
});
