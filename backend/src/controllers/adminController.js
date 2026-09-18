import asyncHandler from "express-async-handler";
import Membership from "../models/Membership.js";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";
import Organization from "../models/Organization.js";

// @route GET /api/admin/orgs/:orgId/stats  (org admin monitoring dashboard)
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
  res.json({
    success: true,
    data: { totalUsers, pending, approved, rejected, postedVehicles, ongoing, completed, currentBookings },
  });
});

// @route GET /api/admin/orgs/:orgId/vehicles?status=ongoing
export const orgVehicles = asyncHandler(async (req, res) => {
  const filter = { organization: req.params.orgId };
  if (req.query.status) filter.status = req.query.status;
  const vehicles = await Vehicle.find(filter).populate("postedBy", "name email phone").sort({ createdAt: -1 });
  res.json({ success: true, data: vehicles });
});

// @route GET /api/admin/orgs/:orgId/vehicles/:vehicleId/interest  (interested users for a trip)
export const orgVehicleInterest = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ vehicle: req.params.vehicleId }).populate("passenger", "name email phone");
  res.json({ success: true, data: bookings });
});

// --- Super admin (platform-wide) ---

// @route GET /api/admin/platform/stats
export const platformStats = asyncHandler(async (req, res) => {
  const [orgs, vehicles, bookings, members] = await Promise.all([
    Organization.countDocuments({}),
    Vehicle.countDocuments({}),
    Booking.countDocuments({}),
    Membership.countDocuments({}),
  ]);
  res.json({ success: true, data: { organizations: orgs, vehicles, bookings, memberships: members } });
});

// @route GET /api/admin/platform/orgs
export const platformOrganizations = asyncHandler(async (req, res) => {
  const orgs = await Organization.find({}).sort({ createdAt: -1 });
  res.json({ success: true, data: orgs });
});
