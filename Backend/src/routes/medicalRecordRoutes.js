import express from "express";

import {
  getMyMedicalRecords,
  getMedicalRecordById,
  uploadMedicalRecord,
  deleteMedicalRecord,
  archiveMedicalRecord,
  viewMedicalRecordFile,
  downloadMedicalRecordFile,
} from "../controllers/medicalRecordController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

import medicalUpload from "../middleware/medicalUpload.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| MEDICAL RECORD SECURITY
|--------------------------------------------------------------------------
|
| Every route requires:
|
| 1. Valid JWT
| 2. Patient role
|
|--------------------------------------------------------------------------
*/

router.use(
  protect,
  authorize("patient")
);

/*
|--------------------------------------------------------------------------
| GET ALL MY RECORDS
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getMyMedicalRecords
);

/*
|--------------------------------------------------------------------------
| GET RECORD METADATA
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  getMedicalRecordById
);

/*
|--------------------------------------------------------------------------
| UPLOAD MEDICAL DOCUMENT
|--------------------------------------------------------------------------
*/

router.post(
  "/upload",
  medicalUpload.single(
    "medicalDocument"
  ),
  uploadMedicalRecord
);

/*
|--------------------------------------------------------------------------
| VIEW DOCUMENT
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/view",
  viewMedicalRecordFile
);

/*
|--------------------------------------------------------------------------
| DOWNLOAD DOCUMENT
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/download",
  downloadMedicalRecordFile
);

/*
|--------------------------------------------------------------------------
| ARCHIVE DOCUMENT
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/archive",
  archiveMedicalRecord
);

/*
|--------------------------------------------------------------------------
| DELETE DOCUMENT
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  deleteMedicalRecord
);

export default router;