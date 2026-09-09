import express from "express";

import {
  getEmergencyProfile,
  saveEmergencyProfile,
} from "../controllers/emergencyProfileController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| PATIENT EMERGENCY PROFILE
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  protect,
  authorize("patient"),
  getEmergencyProfile
);

router.put(
  "/",
  protect,
  authorize("patient"),
  saveEmergencyProfile
);

export default router;