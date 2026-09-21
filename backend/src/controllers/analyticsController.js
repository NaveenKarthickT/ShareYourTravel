import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";
import Membership from "../models/Membership.js";

const lastNDays = (n) => {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

export const tripsPerDay = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const days = Math.min(parseInt(req.query.days) || 30, 90);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const data = await Vehicle.aggregate([
    { $match: { organization: new mongoose.Types.ObjectId(orgId), createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const map = Object.fromEntries(data.map((d) => [d._id, d.count]));
  const result = lastNDays(days).map((day) => ({ date: day, count: map[day] || 0 }));
  res.json({ success: true, data: result });
});

export const topRoutes = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 5, 20);
  const data = await Vehicle.aggregate([
    { $match: { organization: new mongoose.Types.ObjectId(orgId) } },
    { $group: { _id: { from: "$startLocation", to: "$destination" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  res.json({ success: true, data: data.map((d) => ({ route: `${d._id.from} → ${d._id.to}`, count: d.count })) });
});

export const bookingStatusBreakdown = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const data = await Booking.aggregate([
    { $match: { organization: new mongoose.Types.ObjectId(orgId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  res.json({ success: true, data: data.map((d) => ({ status: d._id, count: d.count })) });
});

export const userRoleBreakdown = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const data = await Membership.aggregate([
    { $match: { organization: new mongoose.Types.ObjectId(orgId), status: "approved" } },
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);
  res.json({ success: true, data: data.map((d) => ({ role: d._id, count: d.count })) });
});

export const orgSummary = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const [totalTrips, totalBookings, completedTrips, activeUsers] = await Promise.all([
    Vehicle.countDocuments({ organization: orgId }),
    Booking.countDocuments({ organization: orgId }),
    Vehicle.countDocuments({ organization: orgId, status: "completed" }),
    Membership.countDocuments({ organization: orgId, status: "approved" }),
  ]);
  res.json({ success: true, data: { totalTrips, totalBookings, completedTrips, activeUsers } });
});
