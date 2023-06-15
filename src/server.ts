// MODULES
import app from "./app";

const server = app.listen(5000, () => {
  console.log("Server is up and running");
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
