import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Feedback from "../models/Feedback.js";

export const submitFeedback = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const booking = await Booking.findById(bookingId).populate("vehicle");
  if (!booking) { res.status(404); throw new Error("Booking not found"); }
  if (String(booking.passenger) !== String(req.user._id)) { res.status(403); throw new Error("Only the passenger of this trip can leave feedback"); }
  if (booking.status !== "completed") { res.status(400); throw new Error("Feedback can only be submitted for completed trips"); }

  const feedback = await Feedback.create({
    organization: booking.organization, vehicle: booking.vehicle._id, booking: booking._id,
    fromUser: req.user._id, aboutUser: booking.vehicle.postedBy, rating, comment,
  });
  res.status(201).json({ success: true, data: feedback });
});

export const feedbackForVehicle = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ vehicle: req.params.vehicleId }).populate("fromUser", "name");
  res.json({ success: true, data: feedback });
});

export const feedbackForUser = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ aboutUser: req.params.userId }).populate("fromUser", "name");
  const avgRating = feedback.length ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : null;
  res.json({ success: true, data: { feedback, avgRating } });
});
