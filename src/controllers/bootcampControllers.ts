// MODULES
import Bootcamp from "../models/bootcampModel";
import { IntentionalError, handlePromiseRej } from "../utils";

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
