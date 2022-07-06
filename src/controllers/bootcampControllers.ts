import { RequestHandler } from "express";

/**@route GET $API_V1/bootcamps
@access public*/
export const getBootcamps: RequestHandler = (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "successfully fetched bootcamps",
  });
};
