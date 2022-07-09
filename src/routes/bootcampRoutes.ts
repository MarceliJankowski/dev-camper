// PACKAGES
import express from "express";

// PROJECT_MODULES
import {
  getBootcamps,
  createBootcamp,
  updateBootcamp,
  getBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
} from "../controllers/bootcampControllers";

const router = express.Router();
export default router;

// END-POINTS
router.route("/").get(getBootcamps).post(createBootcamp);
router.route("/:id").patch(updateBootcamp).get(getBootcamp).delete(deleteBootcamp);

router.get("/radius/:zipcode/:distance", getBootcampsInRadius);
