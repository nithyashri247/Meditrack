import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Doctor from "../models/doctor.js";

import {
  generateAccessToken,
  sanitizeUser,
} from "../utils/auth.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

/*
|--------------------------------------------------------------------------
| PATIENT REGISTRATION
|--------------------------------------------------------------------------
*/

export async function registerPatient(
  req,
  res
) {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number.",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: "patient",
      accountStatus: "active",
      doctorVerification:
        "not_applicable",
    });

    const token =
      generateAccessToken(user);

    return res.status(201).json({
      success: true,
      message:
        "Patient account created successfully.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Patient registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create patient account.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DOCTOR REGISTRATION
|--------------------------------------------------------------------------
*/

export async function registerDoctor(
  req,
  res
) {
  try {
    const {
      name,
      email,
      phone,
      password,
      medicalRegistrationNumber,
      specialization,
      hospital,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !medicalRegistrationNumber ||
      !specialization
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please complete all required professional details.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number.",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone || "").trim(),
      password: hashedPassword,
      role: "doctor",
      accountStatus: "pending",
      doctorVerification: "pending",
      medicalRegistrationNumber: String(medicalRegistrationNumber).trim(),
      specialization: String(specialization).trim(),
      hospital: String(hospital || "").trim(),
    });

    // Create the private doctor profile at registration time so the
    // verified portal never depends on a missing secondary record.
    await Doctor.create({
      user: user._id,
      specialty: String(specialization).trim(),
      hospital: String(hospital || "Not provided").trim() || "Not provided",
      experience: 0,
      qualification: "",
      consultationFee: 0,
      visitTypes: ["in-person"],
      availableDays: [],
      availability: [],
      isAvailable: true,
    });

    return res.status(201).json({
      success: true,
      message:
        "Doctor application submitted successfully. Your account is waiting for verification.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Doctor registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to submit doctor application.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

export async function login(
  req,
  res
) {
  try {
    const {
      email,
      password,
      selectedRole,
    } = req.body;

    if (
      !email ||
      !password ||
      !selectedRole
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email, password and account type are required.",
      });
    }

    const supportedRoles = [
      "patient",
      "doctor",
      "admin",
    ];

    if (
      !supportedRoles.includes(
        selectedRole
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid account type.",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    /*
     * Verify selected role against the
     * actual role stored in MongoDB.
     */

    if (user.role !== selectedRole) {
      return res.status(403).json({
        success: false,
        message:
          "This account does not match the selected role.",
      });
    }

    const passwordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    /*
     * Doctors must be verified before
     * they can access the doctor portal.
     */

    if (user.role === "doctor") {
      if (
        user.doctorVerification ===
        "pending"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your doctor account is awaiting admin verification.",
        });
      }

      if (
        user.doctorVerification !==
        "verified"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your doctor verification is not active.",
        });
      }
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is not currently active.",
      });
    }

    user.lastLogin = new Date();

    await user.save();

    const token =
      generateAccessToken(user);

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process your login.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

export async function getCurrentUser(
  req,
  res
) {
  return res.json({
    success: true,
    user: req.user,
  });
}