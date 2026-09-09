import express from "express";

import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/patientController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Patient profile
|--------------------------------------------------------------------------
|
| Every route is protected.
| Only users with role "patient" can access
| these endpoints.
|
*/

router.use(
  protect,
  authorize("patient")
);

router.get(
  "/profile",
  getMyProfile
);

router.put(
  "/profile",
  updateMyProfile
);

export default router;