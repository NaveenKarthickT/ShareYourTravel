import express from "express";
import {
  createBooking, updateBookingStatus, myBookings, bookingsForVehicle,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.post("/", createBooking);
router.patch("/:id", updateBookingStatus);
router.get("/mine", myBookings);
router.get("/for-vehicle/:vehicleId", bookingsForVehicle);

export default router;
