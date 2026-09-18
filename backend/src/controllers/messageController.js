import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Message from "../models/Message.js";
import Vehicle from "../models/Vehicle.js";

// A chat thread only exists between the two people on a booking: the
// passenger who booked and the owner of the vehicle they booked.
const assertParticipant = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId).populate("vehicle");
  if (!booking) {
    const err = new Error("Booking not found");
    err.statusCode = 404;
    throw err;
  }
  const isPassenger = String(booking.passenger) === String(userId);
  const isOwner = String(booking.vehicle.postedBy) === String(userId);
  if (!isPassenger && !isOwner) {
    const err = new Error("Not authorized to access this chat");
    err.statusCode = 403;
    throw err;
  }
  // Chat opens once a request is confirmed, and stays open through completion.
  if (!["confirmed", "completed"].includes(booking.status)) {
    const err = new Error("Chat is only available for confirmed or completed trips");
    err.statusCode = 400;
    throw err;
  }
  return booking;
};

// @route GET /api/messages/:bookingId
export const getMessages = asyncHandler(async (req, res) => {
  let booking;
  try {
    booking = await assertParticipant(req.params.bookingId, req.user._id);
  } catch (e) {
    res.status(e.statusCode || 500);
    throw e;
  }

  const messages = await Message.find({ booking: booking._id })
    .populate("sender", "name")
    .sort({ createdAt: 1 });

  // Mark as read by the requesting user
  await Message.updateMany(
    { booking: booking._id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  res.json({
    success: true,
    data: {
      messages,
      otherParty:
        String(booking.passenger) === String(req.user._id)
          ? booking.vehicle.postedBy
          : booking.passenger,
    },
  });
});

// @route POST /api/messages  { bookingId, text }
export const sendMessage = asyncHandler(async (req, res) => {
  const { bookingId, text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Message text is required");
  }
  let booking;
  try {
    booking = await assertParticipant(bookingId, req.user._id);
  } catch (e) {
    res.status(e.statusCode || 500);
    throw e;
  }

  const message = await Message.create({
    booking: booking._id,
    sender: req.user._id,
    text: text.trim(),
    readBy: [req.user._id],
  });
  const populated = await message.populate("sender", "name");
  res.status(201).json({ success: true, data: populated });
});

// @route GET /api/messages/unread/count  (badge count across all my chats)
export const unreadCount = asyncHandler(async (req, res) => {
  const myBookings = await Booking.find({
    status: { $in: ["confirmed", "completed"] },
    $or: [{ passenger: req.user._id }],
  }).select("_id");

  // also include bookings for vehicles the user owns
  const myVehicleIds = await Vehicle.find({ postedBy: req.user._id }).select("_id");
  const ownerBookings = await Booking.find({
    vehicle: { $in: myVehicleIds.map((v) => v._id) },
    status: { $in: ["confirmed", "completed"] },
  }).select("_id");

  const bookingIds = [...myBookings, ...ownerBookings].map((b) => b._id);
  const count = await Message.countDocuments({
    booking: { $in: bookingIds },
    readBy: { $ne: req.user._id },
    sender: { $ne: req.user._id },
  });
  res.json({ success: true, data: { count } });
});
