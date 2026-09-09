import express from "express";
import { chatWithMediTrackAI } from "../controllers/aiController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("patient"));
router.post("/chat", chatWithMediTrackAI);

export default router;
