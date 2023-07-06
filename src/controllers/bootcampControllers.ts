// MODULES
import Bootcamp from "../models/bootcampModel";
import { handlePromiseRej } from "../utils";

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
