import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token =
      authorization.substring(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.id
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        success: false,
        message:
          "This account has been suspended.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired authentication token.",
    });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action.",
      });
    }

    next();
  };
}

/*
|--------------------------------------------------------------------------
| VERIFIED DOCTOR ACCESS
|--------------------------------------------------------------------------
| Defense-in-depth: even with a valid JWT, doctor APIs require
| an active account and explicit admin verification.
|--------------------------------------------------------------------------
*/
export function requireVerifiedDoctor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (
    req.user.role !== "doctor" ||
    req.user.accountStatus !== "active" ||
    req.user.doctorVerification !== "verified"
  ) {
    return res.status(403).json({
      success: false,
      message: "Verified doctor authorization is required.",
    });
  }

  next();
}
