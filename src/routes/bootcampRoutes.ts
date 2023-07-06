// PACKAGES
import express from "express";

// MODULES
import { createBootcamp } from "../controllers/bootcampControllers";

const router = express.Router();
export default router;

// ENDPOINTS
router.route("/").post(createBootcamp);
