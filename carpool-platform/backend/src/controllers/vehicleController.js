import asyncHandler from "express-async-handler";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";

export const createVehicle = asyncHandler(async (req, res) => {
  const { organization, vehicleType, vehicleModel, vehicleNumber, startLocation, destination,
    travelDate, travelTime, totalSeats, farePerSeat, notes } = req.body;

  if (!organization || !startLocation || !destination || !travelDate || !travelTime || !totalSeats) {
    res.status(400);
    throw new Error("Missing required trip fields");
  }

  const vehicle = await Vehicle.create({
    organization, postedBy: req.user._id, vehicleType, vehicleModel, vehicleNumber,
    startLocation, destination, travelDate, travelTime,
    totalSeats, availableSeats: totalSeats, farePerSeat, notes,
  });
  res.status(201).json({ success: true, data: vehicle });
});

export const searchVehicles = asyncHandler(async (req, res) => {
  const { organization, startLocation, destination, date, minSeats, status } = req.query;
  if (!organization) { res.status(400); throw new Error("organization is required"); }
  const filter = { organization };
  if (startLocation) filter.startLocation = { $regex: startLocation, $options: "i" };
  if (destination) filter.destination = { $regex: destination, $options: "i" };
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.travelDate = { $gte: start, $lt: end };
  }
  if (minSeats) filter.availableSeats = { $gte: Number(minSeats) };
  filter.status = status || { $in: ["available", "full", "ongoing"] };

  const vehicles = await Vehicle.find(filter).populate("postedBy", "name email phone avatar").sort({ travelDate: 1, createdAt: -1 });
  res.json({ success: true, data: vehicles });
});

export const latestVehicles = asyncHandler(async (req, res) => {
  const { organization, limit = 6 } = req.query;
  const filter = { status: "available" };
  if (organization) filter.organization = organization;
  const vehicles = await Vehicle.find(filter).populate("postedBy", "name avatar").sort({ createdAt: -1 }).limit(Number(limit));
  res.json({ success: true, data: vehicles });
});

export const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id).populate("postedBy", "name email phone avatar");
  if (!vehicle) { res.status(404); throw new Error("Vehicle/trip not found"); }
  res.json({ success: true, data: vehicle });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) { res.status(404); throw new Error("Vehicle/trip not found"); }
  if (String(vehicle.postedBy) !== String(req.user._id) && req.user.platformRole !== "super_admin") {
    res.status(403);
    throw new Error("Only the trip owner can update this post");
  }
  const allowed = ["status", "notes", "travelDate", "travelTime", "farePerSeat"];
  const previousStatus = vehicle.status;
  allowed.forEach((field) => { if (req.body[field] !== undefined) vehicle[field] = req.body[field]; });
  await vehicle.save();

  if (vehicle.status === "completed" && previousStatus !== "completed") {
    await Booking.updateMany(
      { vehicle: vehicle._id, status: "confirmed" },
      { status: "completed", respondedAt: new Date() }
    );
  }
  res.json({ success: true, data: vehicle });
});

export const myVehicles = asyncHandler(async (req, res) => {
  const filter = { postedBy: req.user._id };
  if (req.query.organization) filter.organization = req.query.organization;
  if (req.query.status) filter.status = req.query.status;
  const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: vehicles });
});
