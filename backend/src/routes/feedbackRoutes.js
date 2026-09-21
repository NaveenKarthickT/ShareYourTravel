import express from "express";
import { submitFeedback, feedbackForVehicle, feedbackForUser } from "../controllers/feedbackController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.post("/", submitFeedback);
router.get("/vehicle/:vehicleId", feedbackForVehicle);
router.get("/user/:userId", feedbackForUser);

export default router;
