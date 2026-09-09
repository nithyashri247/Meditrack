import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| MEDICATION LOG
|--------------------------------------------------------------------------
|
| This collection stores what happened with each scheduled dose.
|
| Example:
|
| 08:00 AM → scheduled
| 08:04 AM → taken
|
| or
|
| 08:00 PM → scheduled
| 10:15 PM → missed
|
|--------------------------------------------------------------------------
*/

const medicationLogSchema =
  new mongoose.Schema(
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
      | PRESCRIPTION
      |--------------------------------------------------------------------------
      */

      prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prescription",
        required: true,
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | MEDICINE
      |--------------------------------------------------------------------------
      |
      | This is the _id of the medicine subdocument
      | inside Prescription.medicines.
      |
      */

      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
      },

      medicineName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      dosage: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | SCHEDULE
      |--------------------------------------------------------------------------
      */

      scheduledDate: {
        type: Date,
        required: true,
        index: true,
      },

      scheduledTime: {
        type: String,
        required: true,
        match:
          /^(?:[01]\d|2[0-3]):[0-5]\d$/,
      },

      scheduleLabel: {
        type: String,
        enum: [
          "morning",
          "afternoon",
          "evening",
          "night",
          "custom",
        ],
        default: "custom",
      },

      /*
      |--------------------------------------------------------------------------
      | FOOD INSTRUCTION
      |--------------------------------------------------------------------------
      */

      foodInstruction: {
        type: String,
        enum: [
          "before_food",
          "after_food",
          "with_food",
          "empty_stomach",
          "anytime",
        ],
        default: "anytime",
      },

      /*
      |--------------------------------------------------------------------------
      | ACTUAL STATUS
      |--------------------------------------------------------------------------
      */

      status: {
        type: String,
        enum: [
          "scheduled",
          "taken",
          "skipped",
          "snoozed",
          "missed",
        ],
        default: "scheduled",
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | ACTUAL ACTION TIMES
      |--------------------------------------------------------------------------
      */

      takenAt: {
        type: Date,
        default: null,
      },

      skippedAt: {
        type: Date,
        default: null,
      },

      snoozedUntil: {
        type: Date,
        default: null,
      },

      missedAt: {
        type: Date,
        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | PATIENT NOTE
      |--------------------------------------------------------------------------
      */

      note: {
        type: String,
        trim: true,
        maxlength: 300,
        default: "",
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
| The combination below helps quickly find a patient's
| medication schedule for a particular day.
|
|--------------------------------------------------------------------------
*/

medicationLogSchema.index({
  patient: 1,
  scheduledDate: 1,
  scheduledTime: 1,
});

medicationLogSchema.index({
  patient: 1,
  status: 1,
  scheduledDate: -1,
});

medicationLogSchema.index({
  prescription: 1,
  medicineId: 1,
  scheduledDate: -1,
});


/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const MedicationLog =
  mongoose.model(
    "MedicationLog",
    medicationLogSchema
  );

export default MedicationLog;