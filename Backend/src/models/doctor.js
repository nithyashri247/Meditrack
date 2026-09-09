import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    specialty: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    hospital: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
    },

    qualification: {
      type: String,
      trim: true,
    },

    consultationFee: {
      type: Number,
      min: 0,
      max: 1000000,
      default: 0,
    },

    clinicAddress: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      maxlength: 10,
      default: "",
    },

    education: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    certifications: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    areasOfExpertise: [
      {
        type: String,
        trim: true,
        maxlength: 80,
      },
    ],

    servicesOffered: [
      {
        type: String,
        trim: true,
        maxlength: 100,
      },
    ],

    languages: [
      {
        type: String,
        trim: true,
      },
    ],

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    visitTypes: {
      type: [
        {
          type: String,
          enum: [
            "in-person",
            "video",
          ],
        },
      ],
      default: ["in-person"],
    },

    availableDays: [
      {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
    ],

    consultationDuration: {
      type: Number,
      default: 30,
      min: 10,
      max: 120,
    },

    availability: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },

        slots: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.5,
    },

    totalReviews: {
      type: Number,
      min: 0,
      default: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    /*
     * Doctor-controlled leave dates.
     * These dates are used by appointment booking
     * and are never editable by patients.
     */
    leaveDates: [
      {
        date: {
          type: Date,
          required: true,
        },
        reason: {
          type: String,
          trim: true,
          maxlength: 200,
          default: "",
        },
      },
    ],

    profileImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model(
  "Doctor",
  doctorSchema
);

export default Doctor;