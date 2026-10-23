import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import roomRoutes from "./routes/rooms.js";
import temperatureRoutes from "./routes/temperatures.js";
import visitRoutes from "./routes/visits.js";
import dischargeRoutes from "./routes/discharges.js";
import dashboardRoutes from "./routes/dashboard.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { feverThresholdC } from "./utils/recovery.js";
import { initializeStore, localDataDirectory } from "./storage/jsonStore.js";

export const app = express();
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.CLIENT_ORIGIN || "").split(",").map((value) => value.trim()).filter(Boolean),
]);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: [...allowedOrigins],
  credentials: false,
}));
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", storage: "local-json" }));
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/temperatures", temperatureRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/discharges", dischargeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);

initializeStore().then(() => {
  feverThresholdC();
  app.listen(port, () => {
    console.info(`CareTrack API listening on ${port}; JSON data: ${localDataDirectory}`);
  });
}).catch((error) => {
  console.error(`Unable to start CareTrack API: ${error.message}`);
  process.exitCode = 1;
});
