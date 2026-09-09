import mongoose from "mongoose";

const vitalReadingSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | PATIENT
    |--------------------------------------------------------------------------
    */

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | VITAL TYPE
    |--------------------------------------------------------------------------
    */

    type: {
      type: String,
      enum: [
        "blood_pressure",
        "heart_rate",
        "blood_glucose",
        "spo2",
        "temperature",
        "respiratory_rate",
        "weight",
      ],
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | VALUES
    |--------------------------------------------------------------------------
    |
    | Different vitals use different values.
    |
    | Blood pressure:
    |   systolic
    |   diastolic
    |
    | Other vitals:
    |   value
    |
    */

    value: {
      type: Number,
      min: 0,
    },

    systolic: {
      type: Number,
      min: 0,
    },

    diastolic: {
      type: Number,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | UNIT
    |--------------------------------------------------------------------------
    */

    unit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    /*
    |--------------------------------------------------------------------------
    | OPTIONAL CONTEXT
    |--------------------------------------------------------------------------
    */

    note: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    /*
    |--------------------------------------------------------------------------
    | WHEN WAS THE READING TAKEN?
    |--------------------------------------------------------------------------
    */

    recordedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | INFORMATIONAL STATUS
    |--------------------------------------------------------------------------
    |
    | This is an application signal, not a diagnosis.
    |
    */

    status: {
      type: String,
      enum: [
        "not_assessed",
        "within_expected_range",
        "needs_attention",
        "priority_review",
        "urgent",
      ],
      default: "not_assessed",
    },

    /*
    |--------------------------------------------------------------------------
    | SOURCE
    |--------------------------------------------------------------------------
    */

    source: {
      type: String,
      enum: [
        "manual",
        "device",
        "imported",
      ],
      default: "manual",
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
|
| Makes patient history queries faster.
|
*/

vitalReadingSchema.index({
  patient: 1,
  type: 1,
  recordedAt: -1,
});

vitalReadingSchema.index({
  patient: 1,
  recordedAt: -1,
});

const VitalReading = mongoose.model(
  "VitalReading",
  vitalReadingSchema
);

export default VitalReading;