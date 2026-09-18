import asyncHandler from "express-async-handler";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";

// @route POST /api/bookings  (request/book seats on a vehicle)
export const createBooking = asyncHandler(async (req, res) => {
  const { vehicleId, seatsRequested = 1 } = req.body;
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    res.status(404);
    throw new Error("Vehicle/trip not found");
  }
  if (String(vehicle.postedBy) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot book your own posted trip");
  }
  if (vehicle.status !== "available" || vehicle.availableSeats < seatsRequested) {
    res.status(400);
    throw new Error("Not enough available seats for this trip");
  }
  const existing = await Booking.findOne({
    vehicle: vehicleId,
    passenger: req.user._id,
    status: { $in: ["requested", "confirmed"] },
  });
  if (existing) {
    res.status(400);
    throw new Error("You already have an active request for this trip");
  }
  const booking = await Booking.create({
    organization: vehicle.organization,
    vehicle: vehicle._id,
    passenger: req.user._id,
    seatsRequested,
    status: "requested",
  });
  res.status(201).json({ success: true, data: booking });
});

// @route PATCH /api/bookings/:id  (owner confirms/rejects; passenger cancels)
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // confirmed | rejected | cancelled | completed
  const booking = await Booking.findById(req.params.id).populate("vehicle");
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }
  const vehicle = booking.vehicle;
  const isOwner = String(vehicle.postedBy) === String(req.user._id);
  const isPassenger = String(booking.passenger) === String(req.user._id);

  if (["confirmed", "rejected"].includes(status) && !isOwner) {
    res.status(403);
    throw new Error("Only the trip owner can confirm or reject requests");
  }
  if (status === "cancelled" && !isPassenger && !isOwner) {
    res.status(403);
    throw new Error("Not authorized to cancel this booking");
  }

  if (status === "confirmed") {
    if (vehicle.availableSeats < booking.seatsRequested) {
      res.status(400);
      throw new Error("Not enough seats remaining to confirm this booking");
    }
    vehicle.availableSeats -= booking.seatsRequested;
    if (vehicle.availableSeats === 0) vehicle.status = "full";
    await vehicle.save();
  }
  if (status === "cancelled" && booking.status === "confirmed") {
    // release the seats back
    vehicle.availableSeats += booking.seatsRequested;
    if (vehicle.status === "full") vehicle.status = "available";
    await vehicle.save();
  }

  booking.status = status;
  booking.respondedAt = new Date();
  await booking.save();
  res.json({ success: true, data: booking });
});

// @route GET /api/bookings/mine?status=confirmed  (my requests / confirmed trips / completed)
export const myBookings = asyncHandler(async (req, res) => {
  const filter = { passenger: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const bookings = await Booking.find(filter)
    .populate({ path: "vehicle", populate: { path: "postedBy", select: "name email phone" } })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});

// @route GET /api/bookings/for-vehicle/:vehicleId  (owner: see requests/passengers for their trip)
export const bookingsForVehicle = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ vehicle: req.params.vehicleId })
    .populate("passenger", "name email phone")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});
