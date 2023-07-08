// PACKAGES
import express from "express";

// MODULES
import { createBootcamp, getBootcamp, updateBootcamp } from "../controllers/bootcampControllers";

const router = express.Router();
export default router;

// ENDPOINTS
router.route("/").post(createBootcamp);
router.route("/:id").get(getBootcamp).patch(updateBootcamp);
