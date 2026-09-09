import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Doctor from "../models/doctor.js";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase();
}

/*
|--------------------------------------------------------------------------
| PATIENT - CREATE APPOINTMENT
|--------------------------------------------------------------------------
| POST /api/appointments
|
| New appointments always start as "pending".
| The doctor must approve them before they become confirmed.
|--------------------------------------------------------------------------
*/

export async function createAppointment(req, res) {
  try {
    const {
  doctor,
  doctorProfile,
  visitReason,
  visitType,
  appointmentDate,
  appointmentTime,
  duration = 30,
  patientNote = "",
  priority = "normal",
} = req.body;

    if (
      !doctor ||
      !doctorProfile ||
      !visitReason ||
      !visitType ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Doctor, consultation details, date and time are required.",
      });
    }

    if (!isValidObjectId(doctor)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor.",
      });
    }

    if (!isValidObjectId(doctorProfile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor profile.",
      });
    }

    if (
      !["in-person", "video"].includes(visitType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation type.",
      });
    }

    const parsedDate = new Date(appointmentDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date.",
      });
    }

    /*
     * Reject only dates before today (India time).
     * Same-day booking is allowed when the selected slot is still valid.
     */
    const todayIndia = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    const selectedIndia = parsedDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    if (selectedIndia < todayIndia) {
      return res.status(400).json({
        success: false,
        message: "Appointment date cannot be in the past.",
      });
    }

    /*
     * Make sure doctor user exists.
     */
    const doctorUser = await User.findOne({
      _id: doctor,
      role: "doctor",
      accountStatus: "active",
      doctorVerification: "verified",
    }).lean();

    if (!doctorUser) {
      return res.status(404).json({
        success: false,
        message: "Doctor account not found.",
      });
    }

    /*
     * Make sure doctor profile exists and belongs
     * to the selected doctor.
     */
    const doctorData = await Doctor.findOne({
      _id: doctorProfile,
      user: doctor,
    }).lean();

    if (!doctorData) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    if (String(doctorData.user) !== String(doctor)) {
      return res.status(403).json({
        success: false,
        message: "Doctor profile does not match the selected doctor account.",
      });
    }

    if (!doctorData.isAvailable) {
      return res.status(409).json({
        success: false,
        message: "Doctor is currently unavailable.",
      });
    }

    if (!doctorData.visitTypes?.includes(visitType)) {
      return res.status(409).json({
        success: false,
        message: "This consultation type is not currently offered by the doctor.",
      });
    }

    const appointmentDay = parsedDate.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });

    const isOnLeave = (doctorData.leaveDates || []).some((leave) => {
      const leaveDate = new Date(leave.date);
      return leaveDate.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      }) === parsedDate.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
    });

    if (isOnLeave) {
      return res.status(409).json({
        success: false,
        message: "Doctor is on leave for the selected date.",
      });
    }

    if (
      Array.isArray(doctorData.availableDays) &&
      doctorData.availableDays.length &&
      !doctorData.availableDays.includes(appointmentDay)
    ) {
      return res.status(409).json({
        success: false,
        message: "Doctor is not available on the selected day.",
      });
    }

    const daySchedule = (doctorData.availability || []).find(
      (item) => item.day === appointmentDay
    );

    if (!daySchedule || !daySchedule.slots?.includes(String(appointmentTime).trim())) {
      return res.status(409).json({
        success: false,
        message: "That time is not in the doctor's published schedule.",
      });
    }

    /*
     * Prevent the same doctor/time slot from being
     * booked more than once.
     *
     * Cancelled/rejected appointments do not block
     * the slot.
     */
    const conflictingAppointment =
      await Appointment.findOne({
        doctor,
        appointmentDate: parsedDate,
        appointmentTime,
        status: {
          $in: [
            "pending",
            "confirmed",
            "rescheduled",
            "checked-in",
            "in-consultation",
          ],
        },
      }).lean();

    if (conflictingAppointment) {
      return res.status(409).json({
        success: false,
        message:
          "This appointment slot is no longer available.",
      });
    }

    const appointmentId =
      `MT-APT-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

    const appointment =
  await Appointment.create({
    appointmentId,
    patient: req.user._id,
    doctor,
    doctorProfile,

    visitReason: String(
      visitReason
    ).trim(),

    visitType,

    appointmentDate: parsedDate,

    appointmentTime: String(
      appointmentTime
    ).trim(),

    duration: Number(duration) || 30,

    status: "pending",

    priority:
      priority === "urgent"
        ? "urgent"
        : "normal",

    patientNote: String(
      patientNote || ""
    ).trim(),

    reminderEnabled: true,
    reminderSent: false,
  });
    const populated =
      await Appointment.findById(
        appointment._id
      )
        .populate(
          "patient",
          "name email"
        )
        .populate(
          "doctor",
          "name email specialization"
        )
        .populate(
          "doctorProfile"
        )
        .lean();

    return res.status(201).json({
      success: true,
      message:
        "Appointment request submitted. Waiting for doctor approval.",
      data: populated,
    });
  } catch (error) {
    console.error(
      "Create appointment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create the appointment.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| PATIENT - GET MY APPOINTMENTS
|--------------------------------------------------------------------------
| GET /api/appointments/my
|--------------------------------------------------------------------------
*/

export async function getMyAppointments(
  req,
  res
) {
  try {
    const appointments =
      await Appointment.find({
        patient: req.user._id,
      })
        .populate(
          "doctor",
          "name email specialization"
        )
        .populate(
          "doctorProfile"
        )
        .sort({
          priority: -1,
          appointmentDate: 1,
          appointmentTime: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error(
      "Get patient appointments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve your appointments.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| PATIENT - CANCEL APPOINTMENT
|--------------------------------------------------------------------------
| PATCH /api/appointments/:id/cancel
|--------------------------------------------------------------------------
*/

export async function cancelAppointment(
  req,
  res
) {
  try {
    const {
      reason = "",
    } = req.body;

    const appointment =
      await Appointment.findOne({
        _id: req.params.id,
        patient: req.user._id,
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found.",
      });
    }

    if (
      [
        "completed",
        "cancelled",
        "rejected",
        "no-show",
      ].includes(
        normalizeStatus(
          appointment.status
        )
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This appointment can no longer be cancelled.",
      });
    }

    appointment.status =
      "cancelled";

    appointment.cancellationReason =
      String(reason).trim();

    appointment.reminderEnabled =
      false;

    await appointment.save();

    return res.status(200).json({
      success: true,
      message:
        "Appointment cancelled successfully.",
      data: appointment,
    });
  } catch (error) {
    console.error(
      "Cancel appointment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to cancel the appointment.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| PATIENT - RESCHEDULE APPOINTMENT
|--------------------------------------------------------------------------
| PATCH /api/appointments/:id/reschedule
|--------------------------------------------------------------------------
*/

export async function rescheduleAppointment(
  req,
  res
) {
  try {
    const {
      appointmentDate,
      appointmentTime,
      reason = "",
    } = req.body;

    if (
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New date and time are required.",
      });
    }

    const newDate =
      new Date(appointmentDate);

    if (Number.isNaN(newDate.getTime())) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid appointment date.",
      });
    }

    const appointment =
      await Appointment.findOne({
        _id: req.params.id,
        patient: req.user._id,
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found.",
      });
    }

    if (
      [
        "completed",
        "cancelled",
        "rejected",
        "no-show",
      ].includes(
        normalizeStatus(
          appointment.status
        )
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This appointment cannot be rescheduled.",
      });
    }

    const conflict =
      await Appointment.findOne({
        _id: {
          $ne: appointment._id,
        },

        doctor:
          appointment.doctor,

        appointmentDate:
          newDate,

        appointmentTime,

        status: {
          $in: [
            "pending",
            "confirmed",
            "rescheduled",
            "checked-in",
            "in-consultation",
          ],
        },
      }).lean();

    if (conflict) {
      return res.status(409).json({
        success: false,
        message:
          "That time slot is already booked.",
      });
    }

    appointment.appointmentDate =
      newDate;

    appointment.appointmentTime =
      String(
        appointmentTime
      ).trim();

    appointment.rescheduleReason =
      String(reason).trim();

    /*
     * A rescheduled appointment should require
     * doctor approval again.
     */
    appointment.status =
      "pending";

    appointment.reminderEnabled =
      true;

    await appointment.save();

    const populated =
      await Appointment.findById(
        appointment._id
      )
        .populate(
          "doctor",
          "name email specialization"
        )
        .populate(
          "doctorProfile"
        )
        .lean();

    return res.status(200).json({
      success: true,
      message:
        "Appointment rescheduled and sent for doctor approval.",
      data: populated,
    });
  } catch (error) {
    console.error(
      "Reschedule appointment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reschedule the appointment.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOCTOR - GET PENDING APPOINTMENTS
|--------------------------------------------------------------------------
| GET /api/appointments/doctor/pending
|--------------------------------------------------------------------------
*/

export async function getDoctorPendingAppointments(
  req,
  res
) {
  try {
    const appointments =
      await Appointment.find({
        doctor: req.user._id,
        status: "pending",
      })
        .populate(
          "patient",
          "name email"
        )
        .populate(
          "doctorProfile"
        )
        .sort({
          appointmentDate: 1,
          appointmentTime: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error(
      "Get pending doctor appointments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve pending appointments.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOCTOR - GET MY APPOINTMENTS
|--------------------------------------------------------------------------
| GET /api/appointments/doctor
|--------------------------------------------------------------------------
*/
export async function getDoctorAppointments(req, res) {
  try {
    const appointments = await Appointment.find({
      doctor: req.user._id,
      status: {
        $in: [
          "pending",
          "confirmed",
          "rescheduled",
          "checked-in",
          "in-consultation",
        ],
      },
    })
      .populate("patient", "name email phone")
      .sort({
        priority: -1,
        appointmentDate: 1,
        appointmentTime: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Get doctor appointments error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your appointments.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOCTOR - APPROVE APPOINTMENT
|--------------------------------------------------------------------------
| PATCH /api/appointments/:id/approve
|--------------------------------------------------------------------------
*/

export async function approveAppointment(
  req,
  res
) {
  try {
    const appointment =
      await Appointment.findOne({
        _id: req.params.id,
        doctor: req.user._id,
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found.",
      });
    }

    if (
      appointment.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending appointments can be approved.",
      });
    }

    appointment.status =
      "confirmed";

    appointment.reminderEnabled =
      true;

    await appointment.save();

    return res.status(200).json({
      success: true,
      message:
        "Appointment approved successfully.",
      data: appointment,
    });
  } catch (error) {
    console.error(
      "Approve appointment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to approve the appointment.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOCTOR - REJECT APPOINTMENT
|--------------------------------------------------------------------------
| PATCH /api/appointments/:id/reject
|--------------------------------------------------------------------------
*/

export async function rejectAppointment(
  req,
  res
) {
  try {
    const {
      reason = "",
    } = req.body;

    const appointment =
      await Appointment.findOne({
        _id: req.params.id,
        doctor: req.user._id,
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found.",
      });
    }

    if (
      appointment.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending appointments can be rejected.",
      });
    }

    appointment.status =
      "rejected";

    appointment.rejectionReason =
      String(reason).trim();

    appointment.reminderEnabled =
      false;

    await appointment.save();

    return res.status(200).json({
      success: true,
      message:
        "Appointment rejected.",
      data: appointment,
    });
  } catch (error) {
    console.error(
      "Reject appointment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reject the appointment.",
    });
  }
}