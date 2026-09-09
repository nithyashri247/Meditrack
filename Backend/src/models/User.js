import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true,
    },

    accountStatus: {
      type: String,
      enum: [
        "active",
        "pending",
        "rejected",
        "suspended",
      ],
      default: "active",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    doctorVerification: {
      type: String,
      enum: [
        "not_applicable",
        "pending",
        "verified",
        "rejected",
      ],
      default: "not_applicable",
    },

    medicalRegistrationNumber: {
      type: String,
      trim: true,
    },

    specialization: {
      type: String,
      trim: true,
    },

    hospital: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;