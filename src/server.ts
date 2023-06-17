// UNCAUGHT EXCEPTION
process.on("uncaughtException", (err: unknown) => {
  console.error("UNCAUGHT EXCEPTION -", new Date());
  console.error(err);
  console.error("SERVER IS DOWN");
  process.exit(1);
});

// MODULES
import app from "./app";

const server = app.listen(5000, () => {
  console.log("Server is up and running");
});

// UNHANDLED PROMISE REJECTION
process.on("unhandledRejection", (value: unknown) => {
  console.error("UNHANDLED PROMISE REJECTION -", new Date());
  console.error(value);

  server.close(() => {
    console.error("SERVER IS DOWN");
    process.exit(2);
  });
});

// handling 'INT' and 'TERM' signals
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
