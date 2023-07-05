// PACKAGES
import express from "express";
import morgan from "morgan";

// MODULES
import { globalErrorHandler } from "./middlewares";
import { getEnvVar } from "./utils";

const app = express();
export default app;

// MIDDLEWARES
app.use(express.json());

const NODE_ENV = getEnvVar("NODE_ENV");

app.use(
  morgan(NODE_ENV === "production" ? "common" : "dev", {
    skip: req => req.url === "/health",
  })
);

// HEALTH ENDPOINT
app.get("/health", (_, res) => {
  res.status(200).json({ status: "success", message: "healthy" });
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);
