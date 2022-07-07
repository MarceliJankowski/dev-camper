// PROJECT_MODULES
import Bootcamp from "../models/bootcampModel";
import { catchPromiseRej, ApiFeatures } from "../utils";

/**@route GET $API_V1/bootcamps
@access public*/
export const getBootcamps = catchPromiseRej(async ({ query }, res) => {
  const bootcampCursor = Bootcamp.find();
  const bootcamps = await new ApiFeatures(bootcampCursor, query).allFeatures();
  const bootcampsCount = bootcamps.length;

  res.status(200).json({
    status: "success",
    message: "successfully fetched bootcamps",
    count: bootcampsCount,
    bootcamps,
  });
});

/**@route POST $API_V1/bootcamps
@access private*/
export const createBootcamp = catchPromiseRej(async (req, res) => {
  const bootcamp = await Bootcamp.create(req.body);

  res.status(201).json({
    status: "success",
    message: "bootcamp was successfully created",
    bootcamp,
  });
});
