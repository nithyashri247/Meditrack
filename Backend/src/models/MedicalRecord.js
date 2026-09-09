import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | OWNER
    |--------------------------------------------------------------------------
    | The patient who uploaded/owns this record.
    */

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | DOCUMENT INFORMATION
    |--------------------------------------------------------------------------
    */

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    category: {
      type: String,
      enum: [
        "lab_report",
        "scan",
        "prescription",
        "discharge_summary",
        "consultation",
        "vaccination",
        "other",
      ],
      required: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    /*
    |--------------------------------------------------------------------------
    | HEALTHCARE CONTEXT
    |--------------------------------------------------------------------------
    */

    doctorName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    hospitalName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    documentDate: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | FILE INFORMATION
    |--------------------------------------------------------------------------
    |
    | We store metadata in MongoDB.
    | The actual document will be stored securely on the server.
    |
    */

    originalFileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    storedFileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    filePath: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | ACCESS CONTROL
    |--------------------------------------------------------------------------
    */

    visibility: {
      type: String,
      enum: [
        "private",
        "authorized_care",
      ],
      default: "private",
    },

    /*
    |--------------------------------------------------------------------------
    | RECORD STATE
    |--------------------------------------------------------------------------
    */

    status: {
      type: String,
      enum: [
        "active",
        "archived",
      ],
      default: "active",
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | AUDIT INFORMATION
    |--------------------------------------------------------------------------
    */

    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    lastAccessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

medicalRecordSchema.index({
  patient: 1,
  category: 1,
  documentDate: -1,
});

medicalRecordSchema.index({
  patient: 1,
  createdAt: -1,
});

const MedicalRecord = mongoose.model(
  "MedicalRecord",
  medicalRecordSchema
);

export default MedicalRecord;