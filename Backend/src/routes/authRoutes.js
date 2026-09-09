import express from "express";

import {
  login,
  registerPatient,
  registerDoctor,
  getCurrentUser,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

router.post(
  "/register/patient",
  registerPatient
);

router.post(
  "/register/doctor",
  registerDoctor
);

router.post(
  "/login",
  login
);

router.get(
  "/me",
  protect,
  getCurrentUser
);

export default router;