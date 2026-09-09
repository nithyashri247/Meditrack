import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import "dotenv/config";
import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import vitalRoutes from "./routes/vitalRoutes.js";
import medicalRecordRoutes from "./routes/medicalRecordRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import emergencyProfileRoutes from "./routes/emergencyProfileRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
const app = express();

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| SECURITY
|--------------------------------------------------------------------------
*/

// Adds important HTTP security headers
app.use(helmet());

// Allows requests only from our frontend
app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
  }),
);

// Protects the API from excessive requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

/*
|--------------------------------------------------------------------------
| REQUEST PARSING
|--------------------------------------------------------------------------
*/

// JSON request body
app.use(
  express.json({
    limit: "1mb",
  }),
);

// Form data
app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

/*
|--------------------------------------------------------------------------
| LOGGING
|--------------------------------------------------------------------------
*/

app.use(morgan("dev"));

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "MediTrack API",
    message:
      "MediTrack Professional backend is running.",
    timestamp: new Date().toISOString(),
  });
});
app.use(
  "/api/auth",
  authRoutes
);
app.use(
  "/api/patients",
  patientRoutes
);
app.use(
  "/api/vitals",
  vitalRoutes
);
app.use(
  "/api/medical-records",
  medicalRecordRoutes
);
app.use(
  "/api/prescriptions",
  prescriptionRoutes
);
app.use(
  "/api/doctors",
  doctorRoutes
);
app.use(
  "/api/appointments",
  appointmentRoutes
);
app.use(
  "/api/emergency-profile",
  emergencyProfileRoutes
);
app.use(
  "/api/ai",
  aiRoutes
);

/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/

await connectDatabase();

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(
    `✓ MediTrack API running on http://localhost:${PORT}`,
  );
});