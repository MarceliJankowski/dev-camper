// PACKAGES
import express from "express";

// PROJECT_MODULES
import { getBootcamps } from "../controllers/bootcampControllers";

const router = express.Router();
export default router;

router.route("/").get(getBootcamps);
