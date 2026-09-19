import asyncHandler from "express-async-handler";
import Membership from "../models/Membership.js";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";

export const orgStats = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const [totalUsers, pending, approved, rejected, postedVehicles, ongoing, completed, currentBookings] =
    await Promise.all([
      Membership.countDocuments({ organization: orgId }),
      Membership.countDocuments({ organization: orgId, status: "pending" }),
      Membership.countDocuments({ organization: orgId, status: "approved" }),
      Membership.countDocuments({ organization: orgId, status: "rejected" }),
      Vehicle.countDocuments({ organization: orgId }),
      Vehicle.countDocuments({ organization: orgId, status: "ongoing" }),
      Vehicle.countDocuments({ organization: orgId, status: "completed" }),
      Booking.countDocuments({ organization: orgId, status: { $in: ["requested", "confirmed"] } }),
    ]);
  res.json({ success: true, data: { totalUsers, pending, approved, rejected, postedVehicles, ongoing, completed, currentBookings } });
});

export const orgVehicles = asyncHandler(async (req, res) => {
  const filter = { organization: req.params.orgId };
  if (req.query.status) filter.status = req.query.status;
  const vehicles = await Vehicle.find(filter).populate("postedBy", "name email phone").sort({ createdAt: -1 });
  res.json({ success: true, data: vehicles });
});

export const orgVehicleInterest = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ vehicle: req.params.vehicleId }).populate("passenger", "name email phone");
  res.json({ success: true, data: bookings });
});

export const platformStats = asyncHandler(async (req, res) => {
  const [orgs, vehicles, bookings, members] = await Promise.all([
    Organization.countDocuments({}),
    Vehicle.countDocuments({}),
    Booking.countDocuments({}),
    Membership.countDocuments({}),
  ]);
  res.json({ success: true, data: { organizations: orgs, vehicles, bookings, memberships: members } });
});

export const platformOrganizations = asyncHandler(async (req, res) => {
  const orgs = await Organization.find({}).populate("createdBy", "name email").sort({ createdAt: -1 });
  const withCounts = await Promise.all(orgs.map(async (o) => {
    const [userCount, vehicleCount] = await Promise.all([
      Membership.countDocuments({ organization: o._id, status: "approved" }),
      Vehicle.countDocuments({ organization: o._id }),
    ]);
    return { ...o.toObject(), userCount, vehicleCount };
  }));
  res.json({ success: true, data: withCounts });
});

export const setOrganizationActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") { res.status(400); throw new Error("isActive (boolean) is required"); }
  const org = await Organization.findByIdAndUpdate(req.params.orgId, { isActive }, { new: true });
  if (!org) { res.status(404); throw new Error("Organization not found"); }
  res.json({ success: true, data: org });
});

export const platformUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

export const setUserPlatformRole = asyncHandler(async (req, res) => {
  const { platformRole } = req.body;
  if (!["super_admin", "user"].includes(platformRole)) { res.status(400); throw new Error("Invalid platformRole"); }
  if (String(req.params.userId) === String(req.user._id) && platformRole !== "super_admin") {
    res.status(400);
    throw new Error("You cannot remove your own super admin access");
  }
  const user = await User.findByIdAndUpdate(req.params.userId, { platformRole }, { new: true }).select("-password");
  if (!user) { res.status(404); throw new Error("User not found"); }
  res.json({ success: true, data: user });
});
