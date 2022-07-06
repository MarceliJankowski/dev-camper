// PACKAGES
import express from "express";

// PROJECT_MODULES
import { bootcampRouter } from "./routes";
import { BOOTCAMPS_URL } from "./constants";

const app = express();
export default app;

app.use(BOOTCAMPS_URL, bootcampRouter);
