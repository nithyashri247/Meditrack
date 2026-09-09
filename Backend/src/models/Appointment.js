import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    doctorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    visitReason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    visitType: {
      type: String,
      enum: [
        "in-person",
        "video",
      ],
      required: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },

    appointmentTime: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: Number,
      default: 30,
      min: 10,
      max: 120,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "rejected",
        "rescheduled",
        "checked-in",
        "in-consultation",
        "completed",
        "cancelled",
        "no-show",
      ],
      default: "pending",
      index: true,
    },
    priority: {
  type: String,
  enum: [
    "normal",
    "urgent",
  ],
  default: "normal",
  index: true,
},

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    rescheduleReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    attachedRecords: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalRecord",
      },
    ],

    patientNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    doctorNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    checkInTime: {
      type: Date,
      default: null,
    },

    consultationStartedAt: {
      type: Date,
      default: null,
    },

    consultationCompletedAt: {
      type: Date,
      default: null,
    },

    reminderEnabled: {
      type: Boolean,
      default: true,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({
  doctor: 1,
  appointmentDate: 1,
  appointmentTime: 1,
});

appointmentSchema.index({
  patient: 1,
  appointmentDate: -1,
});

const Appointment = mongoose.model(
  "Appointment",
  appointmentSchema
);

export default Appointment;