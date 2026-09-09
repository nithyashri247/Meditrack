import express from "express";

import {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionById,
  updatePatientNotes,
  stopMedicine,
  completePrescription,
  getTodaysMedicationLogs,
  updateMedicationLogStatus,
  getMedicationAdherence,
  deletePrescription,
} from "../controllers/prescriptionController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PATIENT PRESCRIPTION SECURITY
|--------------------------------------------------------------------------
*/

router.use(
  protect,
  authorize("patient")
);

/*
|--------------------------------------------------------------------------
| PRESCRIPTIONS
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  createPrescription
);

router.get(
  "/",
  getMyPrescriptions
);

/*
|--------------------------------------------------------------------------
| MEDICATION SCHEDULE
|--------------------------------------------------------------------------
*/

router.get(
  "/medications/today",
  getTodaysMedicationLogs
);

router.get(
  "/medications/adherence",
  getMedicationAdherence
);

router.patch(
  "/medications/:logId/status",
  updateMedicationLogStatus
);

/*
|--------------------------------------------------------------------------
| SINGLE PRESCRIPTION
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  getPrescriptionById
);

router.patch(
  "/:id/notes",
  updatePatientNotes
);

router.patch(
  "/:id/complete",
  completePrescription
);

/*
|--------------------------------------------------------------------------
| STOP MEDICINE
|--------------------------------------------------------------------------
*/

router.patch(
  "/:prescriptionId/medicines/:medicineId/stop",
  stopMedicine
);
router.delete(
  "/:id",
  protect,
  authorize("patient"),
  deletePrescription
);


export default router;