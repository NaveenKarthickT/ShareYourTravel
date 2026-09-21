import express from "express";
import { getMessages, sendMessage, unreadCount } from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.get("/unread/count", unreadCount);
router.get("/:bookingId", getMessages);
router.post("/", sendMessage);

export default router;
