// PROJECT_MODULES
import app from "./app";

const server = app.listen(5000, () => {
  console.log("Server is up and running");
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
