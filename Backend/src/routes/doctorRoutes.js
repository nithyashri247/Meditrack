import express from "express";

import {
  getDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  updateDoctorAvailability,
  addDoctorLeave,
  removeDoctorLeave,
  getPendingDoctorApplications,
  verifyDoctorApplication,
} from "../controllers/doctorController.js";

import {
  protect,
  authorize,
  requireVerifiedDoctor,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| DOCTOR DISCOVERY
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getDoctors
);

/*
|--------------------------------------------------------------------------
| VERIFIED DOCTOR SELF-SERVICE
|--------------------------------------------------------------------------
*/

router.get(
  "/me/profile",
  protect,
  authorize("doctor"),
  requireVerifiedDoctor,
  getMyDoctorProfile
);

router.patch(
  "/me/profile",
  protect,
  authorize("doctor"),
  requireVerifiedDoctor,
  updateMyDoctorProfile
);

router.patch(
  "/me/availability",
  protect,
  authorize("doctor"),
  requireVerifiedDoctor,
  updateDoctorAvailability
);

router.post(
  "/me/leave",
  protect,
  authorize("doctor"),
  requireVerifiedDoctor,
  addDoctorLeave
);

router.delete(
  "/me/leave/:leaveId",
  protect,
  authorize("doctor"),
  requireVerifiedDoctor,
  removeDoctorLeave
);

/*
|--------------------------------------------------------------------------
| ADMIN - DOCTOR VERIFICATION
|--------------------------------------------------------------------------
*/

router.get(
  "/admin/pending",
  protect,
  authorize("admin"),
  getPendingDoctorApplications
);

router.patch(
  "/admin/:userId/verify",
  protect,
  authorize("admin"),
  verifyDoctorApplication
);

/*
|--------------------------------------------------------------------------
| DOCTOR PROFILE
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  getDoctorById
);

export default router;