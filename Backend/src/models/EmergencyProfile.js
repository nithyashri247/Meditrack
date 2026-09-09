import mongoose from "mongoose";

const emergencyContactSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      relationship: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 30,
      },

      alternatePhone: {
        type: String,
        trim: true,
        maxlength: 30,
        default: "",
      },

      isPrimary: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: true,
    }
  );

const emergencyProfileSchema =
  new mongoose.Schema(
    {
      patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      bloodGroup: {
        type: String,
        enum: [
          "",
          "A+",
          "A-",
          "B+",
          "B-",
          "AB+",
          "AB-",
          "O+",
          "O-",
        ],
        default: "",
      },

      allergies: {
        type: [String],
        default: [],
      },

      medicalConditions: {
        type: [String],
        default: [],
      },

      importantNotes: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: "",
      },

      emergencyContacts: {
        type: [emergencyContactSchema],
        default: [],
      },

      allowAuthorizedDoctors: {
        type: Boolean,
        default: true,
      },

      allowEmergencyContactAlert: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

const EmergencyProfile =
  mongoose.model(
    "EmergencyProfile",
    emergencyProfileSchema
  );

export default EmergencyProfile;