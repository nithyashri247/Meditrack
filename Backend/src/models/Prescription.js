import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| MEDICINE SCHEMA
|--------------------------------------------------------------------------
|
| One prescription can contain multiple medicines.
| Each medicine can have its own schedule.
|
*/

const medicineSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | MEDICINE INFORMATION
    |--------------------------------------------------------------------------
    */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    dosage: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    dosageUnit: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    route: {
      type: String,
      enum: [
        "oral",
        "topical",
        "inhaled",
        "injection",
        "sublingual",
        "other",
      ],
      default: "oral",
    },

    /*
    |--------------------------------------------------------------------------
    | FREQUENCY
    |--------------------------------------------------------------------------
    */

    frequency: {
      type: String,
      enum: [
        "once_daily",
        "twice_daily",
        "three_times_daily",
        "four_times_daily",
        "every_4_hours",
        "every_6_hours",
        "every_8_hours",
        "every_12_hours",
        "once_weekly",
        "as_needed",
        "custom",
      ],
      default: "once_daily",
    },

    /*
    |--------------------------------------------------------------------------
    | DAILY SCHEDULE
    |--------------------------------------------------------------------------
    |
    | A medicine may have more than one reminder in a day.
    |
    | Example:
    |
    | [
    |   { label: "Morning", time: "08:00" },
    |   { label: "Night", time: "20:00" }
    | ]
    |
    */

    schedules: [
      {
        label: {
          type: String,
          enum: [
            "morning",
            "afternoon",
            "evening",
            "night",
            "custom",
          ],
          default: "morning",
        },

        time: {
          type: String,
          match:
            /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        },

        enabled: {
          type: Boolean,
          default: true,
        },
      },
    ],

    /*
    |--------------------------------------------------------------------------
    | FOOD RELATIONSHIP
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
    | TREATMENT PERIOD
    |--------------------------------------------------------------------------
    */

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | QUANTITY
    |--------------------------------------------------------------------------
    */

    quantityPerDose: {
      type: Number,
      min: 0.01,
      default: 1,
    },

    totalQuantity: {
      type: Number,
      min: 0,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | INSTRUCTIONS
    |--------------------------------------------------------------------------
    */

    instructions: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    /*
    |--------------------------------------------------------------------------
    | REMINDER SETTINGS
    |--------------------------------------------------------------------------
    */

    remindersEnabled: {
      type: Boolean,
      default: true,
    },

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    status: {
      type: String,
      enum: [
        "active",
        "completed",
        "stopped",
      ],
      default: "active",
    },

    stoppedAt: {
      type: Date,
      default: null,
    },

    stoppedReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  {
    _id: true,
  }
);


/*
|--------------------------------------------------------------------------
| PRESCRIPTION SCHEMA
|--------------------------------------------------------------------------
*/

const prescriptionSchema =
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
      | PRESCRIBING DOCTOR
      |--------------------------------------------------------------------------
      */

      doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

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

      /*
      |--------------------------------------------------------------------------
      | PRESCRIPTION DETAILS
      |--------------------------------------------------------------------------
      */

      prescriptionDate: {
        type: Date,
        required: true,
        default: Date.now,
      },

      diagnosisContext: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },

      followUpDate: {
        type: Date,
        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | ORIGINAL PRESCRIPTION DOCUMENT
      |--------------------------------------------------------------------------
      |
      | The actual PDF/image can be stored using our
      | secure medical document storage system.
      |
      */

      documentRecord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalRecord",
        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | MEDICINES
      |--------------------------------------------------------------------------
      */

      medicines: {
        type: [medicineSchema],
        default: [],
        validate: {
          validator(value) {
            return value.length <= 50;
          },

          message:
            "A prescription cannot contain more than 50 medicines.",
        },
      },

      /*
      |--------------------------------------------------------------------------
      | PATIENT'S PERSONAL DOCTOR NOTES
      |--------------------------------------------------------------------------
      |
      | Example:
      |
      | "Doctor asked me to take this after dinner
      | and come back after two weeks."
      |
      */

      patientNotes: {
        type: String,
        trim: true,
        maxlength: 1500,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | GENERAL DOCTOR INSTRUCTIONS
      |--------------------------------------------------------------------------
      */

      doctorInstructions: {
        type: String,
        trim: true,
        maxlength: 1500,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | PRESCRIPTION STATUS
      |--------------------------------------------------------------------------
      */

      status: {
        type: String,
        enum: [
          "active",
          "completed",
          "archived",
        ],
        default: "active",
        index: true,
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

prescriptionSchema.index({
  patient: 1,
  prescriptionDate: -1,
});

prescriptionSchema.index({
  patient: 1,
  status: 1,
});

prescriptionSchema.index({
  doctor: 1,
  prescriptionDate: -1,
});


/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Prescription =
  mongoose.model(
    "Prescription",
    prescriptionSchema
  );

export default Prescription;