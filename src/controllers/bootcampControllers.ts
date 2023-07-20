// MODULES
import Bootcamp from "../models/bootcampModel";
import { IntentionalError, handlePromiseRej, FeatureQuery } from "../utils";

/**@route POST `$API_V1/bootcamps`
@access private*/
export const createBootcamp = handlePromiseRej(async (req, res) => {
  const bootcamp = await Bootcamp.create(req.body);

  res.status(201).json({
    status: "success",
    message: "bootcamp was successfully created",
    bootcamp,
  });
});

/**@route GET `$API_V1/bootcamps`
@access public*/
export const getBootcamps = handlePromiseRej(async (req, res) => {
  const bootcampCursor = Bootcamp.find();
  const bootcamps = await new FeatureQuery(bootcampCursor, req.query).addAllFeatures().execute();
  const bootcampsCount = bootcamps.length;

  res.status(200).json({
    status: "success",
    message: "successfully fetched bootcamps",
    count: bootcampsCount,
    bootcamps,
  });
});

/**@route GET `$API_V1/bootcamps/:id`
@access public*/
export const getBootcamp = handlePromiseRej(async ({ params: { id } }, res) => {
  const bootcamp = await Bootcamp.findById(id);

  if (!bootcamp) throw new IntentionalError(`bootcamp with id: '${id}' doesn't exist`, 404);

  res
    .status(200)
    .json({ status: "success", message: `successfully fetched bootcamp with id: '${id}'`, bootcamp });
});

/**@route PATCH `$API_V1/bootcamps/:id`
@access private*/
export const updateBootcamp = handlePromiseRej(async ({ params: { id }, body }, res) => {
  const updatedBootcamp = await Bootcamp.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!updatedBootcamp) throw new IntentionalError(`bootcamp with id: '${id}' doesn't exist`, 404);

  res.status(200).json({
    status: "success",
    message: `successfully updated bootcamp with id: '${id}'`,
    updatedBootcamp,
  });
});

/**@route DELETE `$API_V1/bootcamps/:id`
@access private*/
export const deleteBootcamp = handlePromiseRej(async ({ params: { id } }, res) => {
  const deletedBootcamp = await Bootcamp.findByIdAndDelete(id);

  if (!deletedBootcamp) throw new IntentionalError(`bootcamp with id: '${id}' doesn't exist`, 404);

  res.status(204).send();
});
