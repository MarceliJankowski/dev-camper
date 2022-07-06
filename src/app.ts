// PACKAGES
import express from "express";
import morgan from "morgan";

// PROJECT_MODULES
import { bootcampRouter } from "./routes";
import { BOOTCAMPS_URL } from "./constants";
import { getEnvVar } from "./utils";

const app = express();
export default app;

// MOUNT MIDDLEWARES
app.use(express.json());

const NODE_ENV = getEnvVar("NODE_ENV");
if (NODE_ENV === "development") app.use(morgan("dev"));

// MOUNT ROUTERS
app.use(BOOTCAMPS_URL, bootcampRouter);
