import express from "express";

import {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getDoctorPendingAppointments,
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment,
} from "../controllers/appointmentController.js";

import {
  protect,
  authorize,
  requireVerifiedDoctor,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PATIENT APPOINTMENTS
|--------------------------------------------------------------------------
*/

// Book a new appointment
router.post(
  "/",
  protect,
  authorize("patient"),
  createAppointment
);

// Get appointments belonging to logged-in patient
router.get(
  "/my",
  protect,
  authorize("patient"),
  getMyAppointments
);

// Cancel own appointment
router.patch(
  "/:id/cancel",
  protect,
  authorize("patient"),
  cancelAppointment
);

// Reschedule own appointment
router.patch(
  "/:id/reschedule",
  protect,
  authorize("patient"),
  rescheduleAppointment
);

/*
|--------------------------------------------------------------------------
| DOCTOR APPOINTMENTS
|--------------------------------------------------------------------------
*/

// Doctor sees pending appointment requests
router.get(
  "/doctor/pending",
  protect,
  authorize("doctor"),
  requireVerifiedDoctor,
  getDoctorPendingAppointments
);

// Doctor sees all active appointments assigned to them
router.get(
  "/doctor",
  protect,
  authorize("doctor"),
  requireVerifiedDoctor,
  getDoctorAppointments
);

// Doctor approves appointment
router.patch(
  "/:id/approve",
  protect,
  authorize("doctor"),
  requireVerifiedDoctor,
  approveAppointment
);

// Doctor rejects appointment
router.patch(
  "/:id/reject",
  protect,
  authorize("doctor"),
  requireVerifiedDoctor,
  rejectAppointment
);

export default router;