import express from "express";

import {
  createVitalReading,
  getVitalReadings,
  getLatestVitals,
  deleteVitalReading,
} from "../controllers/vitalController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Every vital endpoint is:
|
| 1. Authenticated
| 2. Restricted to patients
|
|--------------------------------------------------------------------------
*/

router.use(
  protect,
  authorize("patient")
);

/*
|--------------------------------------------------------------------------
| Create reading
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  createVitalReading
);

/*
|--------------------------------------------------------------------------
| Get history
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getVitalReadings
);

/*
|--------------------------------------------------------------------------
| Get latest readings
|--------------------------------------------------------------------------
*/

router.get(
  "/latest",
  getLatestVitals
);

/*
|--------------------------------------------------------------------------
| Delete own reading
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  deleteVitalReading
);

export default router;