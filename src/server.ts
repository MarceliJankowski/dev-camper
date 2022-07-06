// uncaughtException listener needs to be executed before any other code
// this way it can it can start listening for exceptions before any other code runs
process.on("uncaughtException", (err: Error) => {
  console.error("SERVER IS DOWN");
  console.error("UNCAUGHT EXCEPTION");
  console.error(err);
  process.exit(1);
});

// PROJECT_MODULES
import app from "./app";
import { logErr } from "./utils";

const server = app.listen(5000, () => {
  console.log("Server is up and running");
});

// EVENT LISTENERS

process.on("unhandledRejection", (err: Error) => {
  logErr("unhandled promise rejection", err);

  server.close(() => {
    logErr("server is down");
    process.exit(2);
  });
});

// docker containers use SIGINT (ctrl-c) and SIGTERM (docker stop) signals to properly exit
// node by default doesn't handle SIGINT/SIGTERM, so I need to handle them manually
// (npm is not propagating these signals so it works only with node as the main process)
process.on("SIGINT", () => gracefullShutDown("SIGINT"));
process.on("SIGTERM", () => gracefullShutDown("SIGTERM"));

function gracefullShutDown(signal: string): void {
  console.log(signal, " Graceful shutdown ", new Date().toISOString());

  server.close(() => {
    console.log("SERVER IS DOWN");
    process.exit(0);
  });
}
