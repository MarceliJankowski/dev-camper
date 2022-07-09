// PACKAGES
import express from "express";

// PROJECT_MODULES
import { getCourses } from "../controllers/courseControllers";

const router = express.Router();
export default router;

// END-POINTS
router.route("/").get(getCourses);
