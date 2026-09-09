import Doctor from "../models/doctor.js";
import User from "../models/User.js";

/*
|--------------------------------------------------------------------------
| GET ALL DOCTORS
|--------------------------------------------------------------------------
*/

export async function getDoctors(req, res) {
  try {
    const {
      search = "",
      specialty = "",
      hospital = "",
      visitType = "",
    } = req.query;

    const userQuery = {
      role: "doctor",
      accountStatus: "active",
      doctorVerification: "verified",
    };

    if (search.trim()) {
      userQuery.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const doctors = await Doctor.find({
      isAvailable: true,

      ...(specialty
        ? {
            specialty: {
              $regex: specialty,
              $options: "i",
            },
          }
        : {}),

      ...(hospital
        ? {
            hospital: {
              $regex: hospital,
              $options: "i",
            },
          }
        : {}),

      ...(visitType
        ? {
            visitTypes: visitType,
          }
        : {}),
    })
      .populate({
        path: "user",
        match: userQuery,
        select: "name specialization hospital",
      })
      .sort({
        rating: -1,
        totalReviews: -1,
      });

    const filteredDoctors = doctors.filter(
      (doctor) => doctor.user
    );

    res.status(200).json({
      success: true,
      count: filteredDoctors.length,
      doctors: filteredDoctors,
    });
  } catch (error) {
    console.error(
      "Get doctors error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to load doctors.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET DOCTOR BY ID
|--------------------------------------------------------------------------
*/

export async function getDoctorById(req, res) {
  try {
    const doctor = await Doctor.findById(
      req.params.id
    ).populate({
      path: "user",
      select:
        "name specialization hospital",
    });

    if (!doctor || !doctor.user) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    if (
      doctor.user.role !== "doctor" ||
      doctor.user.accountStatus !== "active" ||
      doctor.user.doctorVerification !==
        "verified"
    ) {
      return res.status(404).json({
        success: false,
        message: "Doctor is not available.",
      });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error(
      "Get doctor by ID error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load doctor profile.",
    });
  }
}

async function ensureDoctorProfile(user) {
  let doctor = await Doctor.findOne({ user: user._id });

  if (!doctor) {
    doctor = await Doctor.create({
      user: user._id,
      specialty: user.specialization || "Not provided",
      hospital: user.hospital || "Not provided",
      experience: 0,
      qualification: "",
      consultationFee: 0,
      visitTypes: ["in-person"],
      availableDays: [],
      availability: [],
      isAvailable: true,
    });
  }

  return doctor;
}

/*
|--------------------------------------------------------------------------
| DOCTOR - MY PROFILE
|--------------------------------------------------------------------------
| Only the verified doctor can see/edit their own professional profile.
|--------------------------------------------------------------------------
*/
export async function getMyDoctorProfile(req, res) {
  try {
    const doctor = await ensureDoctorProfile(req.user);
    await doctor.populate({
      path: "user",
      select: "name email phone specialization hospital medicalRegistrationNumber doctorVerification accountStatus",
    });

    return res.json({
      success: true,
      doctor: doctor.toObject(),
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load doctor profile.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOCTOR - UPDATE PROFESSIONAL PROFILE
|--------------------------------------------------------------------------
| Only the authenticated, verified doctor can edit their own profile.
| Medical registration and account verification remain administrator-only.
|--------------------------------------------------------------------------
*/
export async function updateMyDoctorProfile(req, res) {
  try {
    const {
      name,
      phone,
      qualification,
      specialty,
      hospital,
      experience,
      consultationFee,
      languages,
      bio,
      clinicAddress,
      city,
      pincode,
      education,
      certifications,
      areasOfExpertise,
      servicesOffered,
      visitTypes,
    } = req.body;

    if (!String(name || "").trim() || !String(specialty || "").trim() || !String(hospital || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, specialization and hospital/clinic are required.",
      });
    }

    const parsedExperience = Number(experience);
    const parsedFee = Number(consultationFee || 0);

    if (!Number.isFinite(parsedExperience) || parsedExperience < 0 || parsedExperience > 60) {
      return res.status(400).json({ success: false, message: "Experience must be between 0 and 60 years." });
    }

    if (!Number.isFinite(parsedFee) || parsedFee < 0 || parsedFee > 1000000) {
      return res.status(400).json({ success: false, message: "Consultation fee is invalid." });
    }

    const allowedVisitTypes = ["in-person", "video"];
    const safeVisitTypes = Array.isArray(visitTypes)
      ? visitTypes.filter((type) => allowedVisitTypes.includes(type))
      : ["in-person"];

    if (safeVisitTypes.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one consultation type." });
    }

    const toStringArray = (value, maxItems, maxLength) => {
      const source = Array.isArray(value)
        ? value
        : String(value || "").split(",");
      return [...new Set(source.map((item) => String(item).trim()).filter(Boolean))]
        .slice(0, maxItems)
        .map((item) => item.slice(0, maxLength));
    };

    const doctor = await ensureDoctorProfile(req.user);

    doctor.specialty = String(specialty).trim().slice(0, 120);
    doctor.hospital = String(hospital).trim().slice(0, 160);
    doctor.experience = parsedExperience;
    doctor.qualification = String(qualification || "").trim().slice(0, 200);
    doctor.consultationFee = parsedFee;
    doctor.languages = toStringArray(languages, 12, 50);
    doctor.bio = String(bio || "").trim().slice(0, 1000);
    doctor.clinicAddress = String(clinicAddress || "").trim().slice(0, 250);
    doctor.city = String(city || "").trim().slice(0, 80);
    doctor.pincode = String(pincode || "").trim().slice(0, 10);
    doctor.education = String(education || "").trim().slice(0, 500);
    doctor.certifications = String(certifications || "").trim().slice(0, 500);
    doctor.areasOfExpertise = toStringArray(areasOfExpertise, 15, 80);
    doctor.servicesOffered = toStringArray(servicesOffered, 15, 100);
    doctor.visitTypes = safeVisitTypes;

    await doctor.save();

    req.user.name = String(name).trim().slice(0, 100);
    req.user.phone = String(phone || "").trim().slice(0, 30);
    req.user.specialization = doctor.specialty;
    req.user.hospital = doctor.hospital;
    await req.user.save();

    await doctor.populate({
      path: "user",
      select: "name email phone specialization hospital medicalRegistrationNumber doctorVerification accountStatus",
    });

    return res.json({
      success: true,
      message: "Professional profile updated successfully.",
      doctor: doctor.toObject(),
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update professional profile.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOCTOR - UPDATE AVAILABILITY
|--------------------------------------------------------------------------
*/
export async function updateDoctorAvailability(req, res) {
  try {
    const {
      availableDays = [],
      availability = [],
      isAvailable = true,
    } = req.body;

    const allowedDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    if (
      !Array.isArray(availableDays) ||
      availableDays.some((day) => !allowedDays.includes(day))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability days.",
      });
    }

    if (!Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: "Availability must be an array.",
      });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          availableDays,
          availability,
          isAvailable: Boolean(isAvailable),
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    return res.json({
      success: true,
      message: "Availability updated successfully.",
      doctor,
    });
  } catch (error) {
    console.error("Update doctor availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update availability.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOCTOR - ADD LEAVE
|--------------------------------------------------------------------------
*/
export async function addDoctorLeave(req, res) {
  try {
    const { date, reason = "" } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Leave date is required.",
      });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave date.",
      });
    }

    parsedDate.setHours(0, 0, 0, 0);

    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    const exists = doctor.leaveDates.some(
      (leave) =>
        new Date(leave.date).toISOString().slice(0, 10) ===
        parsedDate.toISOString().slice(0, 10)
    );

    if (!exists) {
      doctor.leaveDates.push({
        date: parsedDate,
        reason: String(reason).trim().slice(0, 200),
      });
      await doctor.save();
    }

    return res.json({
      success: true,
      message: "Leave date recorded. Patients will not be able to book that date.",
      leaveDates: doctor.leaveDates,
    });
  } catch (error) {
    console.error("Add doctor leave error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to record leave.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOCTOR - REMOVE LEAVE
|--------------------------------------------------------------------------
*/
export async function removeDoctorLeave(req, res) {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    doctor.leaveDates = doctor.leaveDates.filter(
      (leave) =>
        String(leave._id) !== String(req.params.leaveId)
    );

    await doctor.save();

    return res.json({
      success: true,
      message: "Leave removed successfully.",
      leaveDates: doctor.leaveDates,
    });
  } catch (error) {
    console.error("Remove doctor leave error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to remove leave.",
    });
  }
}


/*
|--------------------------------------------------------------------------
| ADMIN - DOCTOR VERIFICATION
|--------------------------------------------------------------------------
| Final activation is an administrator-only action.
|--------------------------------------------------------------------------
*/
export async function getPendingDoctorApplications(req, res) {
  try {
    const doctors = await User.find({
      role: "doctor",
      doctorVerification: "pending",
    })
      .select(
        "name email phone medicalRegistrationNumber specialization hospital doctorVerification accountStatus createdAt"
      )
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Get doctor applications error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load doctor applications.",
    });
  }
}

export async function verifyDoctorApplication(req, res) {
  try {
    const { decision, reason = "" } = req.body;

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification decision.",
      });
    }

    const doctor = await User.findOne({
      _id: req.params.userId,
      role: "doctor",
      doctorVerification: "pending",
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Pending doctor application not found.",
      });
    }

    if (decision === "approve") {
      doctor.doctorVerification = "verified";
      doctor.accountStatus = "active";
    } else {
      doctor.doctorVerification = "rejected";
      doctor.accountStatus = "rejected";
    }

    await doctor.save();

    return res.json({
      success: true,
      message:
        decision === "approve"
          ? "Doctor verified and account activated."
          : "Doctor application rejected.",
      data: {
        userId: doctor._id,
        doctorVerification: doctor.doctorVerification,
        accountStatus: doctor.accountStatus,
        reviewReason: String(reason).trim().slice(0, 300),
      },
    });
  } catch (error) {
    console.error("Verify doctor application error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update doctor verification.",
    });
  }
}
