import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Membership from "../models/Membership.js";

// Helper: last N days as YYYY-MM-DD strings
const lastNDays = (n) => {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

// @route GET /api/analytics/org/:orgId/trips-per-day?days=30
export const tripsPerDay = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const days = Math.min(parseInt(req.query.days) || 30, 90);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const data = await Vehicle.aggregate([
    {
      $match: {
        organization: new mongoose.Types.ObjectId(orgId),
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = Object.fromEntries(data.map((d) => [d._id, d.count]));
  const result = lastNDays(days).map((day) => ({ date: day, count: map[day] || 0 }));

  res.json({ success: true, data: result });
});

// @route GET /api/analytics/org/:orgId/top-routes?limit=5
export const topRoutes = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 5, 20);

  const data = await Vehicle.aggregate([
    { $match: { organization: new mongoose.Types.ObjectId(orgId) } },
    {
      $group: {
        _id: { from: "$startLocation", to: "$destination" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  const result = data.map((d) => ({
    route: `${d._id.from} → ${d._id.to}`,
    count: d.count,
  }));

  res.json({ success: true, data: result });
});

// @route GET /api/analytics/org/:orgId/booking-status
export const bookingStatusBreakdown = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const data = await Booking.aggregate([
    { $match: { organization: new mongoose.Types.ObjectId(orgId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const result = data.map((d) => ({ status: d._id, count: d.count }));
  res.json({ success: true, data: result });
});

// @route GET /api/analytics/org/:orgId/user-roles
export const userRoleBreakdown = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const data = await Membership.aggregate([
    { $match: { organization: new mongoose.Types.ObjectId(orgId), status: "approved" } },
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);
  const result = data.map((d) => ({ role: d._id, count: d.count }));
  res.json({ success: true, data: result });
});

// @route GET /api/analytics/org/:orgId/summary
export const orgSummary = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const [totalTrips, totalBookings, completedTrips, activeUsers] = await Promise.all([
    Vehicle.countDocuments({ organization: orgId }),
    Booking.countDocuments({ organization: orgId }),
    Vehicle.countDocuments({ organization: orgId, status: "completed" }),
    Membership.countDocuments({ organization: orgId, status: "approved" }),
  ]);
  res.json({
    success: true,
    data: { totalTrips, totalBookings, completedTrips, activeUsers },
  });
});