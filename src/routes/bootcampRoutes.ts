// PACKAGES
import express from "express";

// PROJECT_MODULES
import { getBootcamps, createBootcamp } from "../controllers/bootcampControllers";

const router = express.Router();
export default router;

router.route("/").get(getBootcamps).post(createBootcamp);
