// PACKAGES
import express from "express";

// MODULES
import { createBootcamp, getBootcamps, getBootcamp, updateBootcamp } from "../controllers/bootcampControllers";

const router = express.Router();
export default router;

// ENDPOINTS
router.route("/").get(getBootcamps).post(createBootcamp);
router.route("/:id").get(getBootcamp).patch(updateBootcamp);
