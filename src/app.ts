// PACKAGES
import express from "express";

const app = express();
export default app;

// HEALTH END-POINT
app.get("/health", (_, res) => {
  res.status(200).json({ status: "OK" });
});
