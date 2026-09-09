import express from "express";
import cors from "cors";

import { config } from "./config.js";
import { sequelize } from "./database.js";
import { templateRouter } from "./routes/template.routes.js";
import { errorHandler } from "./middleware/errors.js";

export const app = express();

app.disable("x-powered-by");

app.use(cors({
  origin: config.FRONTEND_ORIGIN,
  exposedHeaders: ["Content-Disposition"],
}));

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/ready", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
});

app.use("/api/templates", templateRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);
