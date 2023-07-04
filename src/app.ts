// PACKAGES
import express from "express";
import morgan from "morgan";

// MODULES
import { NODE_ENV } from "./constants";
import { globalErrorHandler } from "./middlewares";

const app = express();
export default app;

// MIDDLEWARES
app.use(express.json());

app.use(
  morgan(NODE_ENV === "production" ? "common" : "dev", {
    skip: req => req.url === "/health",
  })
);

// HEALTH END-POINT
app.get("/health", (_, res) => {
  res.status(200).json({ status: "OK" });
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);
