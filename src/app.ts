// PACKAGES
import express from "express";
import morgan from "morgan";

// PROJECT_MODULES
import { bootcampRouter } from "./routes";
import { BOOTCAMPS_URL } from "./constants";
import { getEnvVar, IntentionalError } from "./utils";
import { globalErrorHandler } from "./middlewares";

const app = express();
export default app;

// MOUNT MIDDLEWARES
app.use(express.json());

const NODE_ENV = getEnvVar("NODE_ENV");
if (NODE_ENV === "development") app.use(morgan("dev"));

// MOUNT ROUTERS
app.use(BOOTCAMPS_URL, bootcampRouter);

// HANDLE INVALID END-POINTS
app.all("*", (req, _res, next) =>
  next(new IntentionalError(`invalid end-point: ${req.method} ${req.path}`, 404))
);

// MOUNT globalErrorHandler MIDDLEWARE
app.use(globalErrorHandler);
