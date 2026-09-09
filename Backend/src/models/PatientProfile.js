import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    relationship: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
  },
  {
    _id: false,
  }
);

const patientProfileSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | LINK TO USER ACCOUNT
    |--------------------------------------------------------------------------
    */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | PERSONAL DETAILS
    |--------------------------------------------------------------------------
    */

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: [
        "male",
        "female",
        "other",
        "prefer_not_to_say",
      ],
      default: null,
    },

    bloodGroup: {
      type: String,
      enum: [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
        "unknown",
      ],
      default: "unknown",
    },

    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    state: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    /*
    |--------------------------------------------------------------------------
    | HEALTH INFORMATION
    |--------------------------------------------------------------------------
    */

    allergies: [
      {
        type: String,
        trim: true,
        maxlength: 100,
      },
    ],

    medicalConditions: [
      {
        type: String,
        trim: true,
        maxlength: 150,
      },
    ],

    previousSurgeries: [
      {
        type: String,
        trim: true,
        maxlength: 150,
      },
    ],

    familyHistory: [
      {
        type: String,
        trim: true,
        maxlength: 150,
      },
    ],

    /*
    |--------------------------------------------------------------------------
    | LIFESTYLE
    |--------------------------------------------------------------------------
    */

    smokingStatus: {
      type: String,
      enum: [
        "never",
        "former",
        "occasional",
        "regular",
        "prefer_not_to_say",
      ],
      default: "prefer_not_to_say",
    },

    alcoholStatus: {
      type: String,
      enum: [
        "never",
        "former",
        "occasional",
        "regular",
        "prefer_not_to_say",
      ],
      default: "prefer_not_to_say",
    },

    activityLevel: {
      type: String,
      enum: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
        "prefer_not_to_say",
      ],
      default: "prefer_not_to_say",
    },

    /*
    |--------------------------------------------------------------------------
    | EMERGENCY INFORMATION
    |--------------------------------------------------------------------------
    */

    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({}),
    },

    criticalNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    /*
    |--------------------------------------------------------------------------
    | PROFILE STATUS
    |--------------------------------------------------------------------------
    */

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    profileCompletionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const PatientProfile =
  mongoose.model(
    "PatientProfile",
    patientProfileSchema
  );

export default PatientProfile;