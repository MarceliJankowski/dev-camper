// REGISTERING LISTENERS/HANDLERS

process.on("uncaughtException", (err: unknown) => {
  console.error("UNCAUGHT EXCEPTION -", new Date());
  console.error(err);
  console.error("SERVER IS DOWN");
  process.exit(1);
});

process.on("unhandledRejection", (value: unknown) => {
  console.error("UNHANDLED PROMISE REJECTION -", new Date());
  console.error(value);

  server.close(() => {
    console.error("SERVER IS DOWN");
    process.exit(2);
  });
});

process.on("SIGINT", () => gracefulShutdown("INT"));
process.on("SIGTERM", () => gracefulShutdown("TERM"));

function gracefulShutdown(signal: string): void {
  console.log(signal, "signal received -", new Date());
  console.log("Gracefully shutting down...");

  server.close(() => {
    console.log("SERVER IS DOWN");
    process.exit(0);
  });
}

// PACKAGES
import mongoose from "mongoose";

// MODULES
import app from "./app";
import { NODE_ENV } from "./constants";
import { getEnvVar } from "./utils";

const PORT = getEnvVar("PORT");

const server = app.listen(PORT, () => {
  console.log("SERVER IS UP");
  console.log("NODE_ENV: " + NODE_ENV);
  console.log("PORT: " + PORT);
});

const MONGO_PORT = getEnvVar("MONGO_PORT");
const MONGO_PASSWORD = getEnvVar("MONGO_PASSWORD");
const MONGO_USERNAME = getEnvVar("MONGO_USERNAME");
const MONGO_URL = getEnvVar("MONGO_URL")
  .replace(/{PASSWORD}/, MONGO_PASSWORD)
  .replace(/{USERNAME}/, MONGO_USERNAME)
  .replace(/{PORT}/, MONGO_PORT);

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("SERVER SUCCESSFULLY CONNECTED WITH DATABASE"))
  .catch(err => {
    console.error("SERVER FAILED TO CONNECT WITH DATABASE -", new Date());
    console.error(err);
    process.exit(3);
  });
