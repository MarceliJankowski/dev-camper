// PROJECT_MODULES
import Bootcamp from "../models/bootcampModel";
import { catchPromiseRej, ApiFeatures, IntentionalError, geocoder, getEnvVar } from "../utils";

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

/**@route PATCH $API_V1/bootcamps/:id
@access private*/
export const updateBootcamp = catchPromiseRej(async ({ params: { id }, body }, res) => {
  const updatedBootcamp = await Bootcamp.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!updatedBootcamp) throw new IntentionalError(`bootcamp with id: ${id} does not exist`, 404);

  res.status(200).json({
    status: "success",
    message: `successfully updated bootcamp with id: ${id}`,
    updatedBootcamp,
  });
});

/**@route GET $API_V1/bootcamps/:id
@access public*/
export const getBootcamp = catchPromiseRej(async ({ params: { id } }, res) => {
  const bootcamp = await Bootcamp.findById(id);

  if (!bootcamp) throw new IntentionalError(`bootcamp with id: ${id} does not exist`, 404);

  res
    .status(200)
    .json({ status: "success", message: `successfully fetched bootcamp with id: ${id}`, bootcamp });
});

/**@route DELETE $API_V1/bootcamps/:id
@access private*/
export const deleteBootcamp = catchPromiseRej(async ({ params: { id } }, res) => {
  const deletedBootcamp = await Bootcamp.findByIdAndDelete(id);

  if (!deletedBootcamp) throw new IntentionalError(`bootcamp with id: ${id} does not exist`, 404);

  res.status(204).send();
});

/**@route GET $API_V1/bootcamps/radius/:zipcode/:distance
@access public*/
export const getBootcampsInRadius = catchPromiseRej(async (req, res) => {
  const { zipcode, distance } = req.params as { zipcode: string; distance: string };

  const [{ latitude, longitude }] = await geocoder.geocode(zipcode);

  const EARTH_RADIUS = Number(getEnvVar("EARTH_RADIUS_KM"));
  const radius = Number(distance) / EARTH_RADIUS;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[longitude, latitude], radius] } },
  });

  res.status(200).json({
    status: "success",
    count: bootcamps.length,
    bootcamps,
  });
});
