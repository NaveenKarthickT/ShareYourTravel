import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import Message from "../models/Message.js";

export const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const myVehicleIds = (await Vehicle.find({ postedBy: userId }).select("_id")).map((v) => v._id);

  const pendingBookings = await Booking.find({ vehicle: { $in: myVehicleIds }, status: "requested" })
    .populate("passenger", "name")
    .populate("vehicle", "startLocation destination")
    .sort({ createdAt: -1 });

  const pendingRequests = pendingBookings.map((b) => ({
    bookingId: b._id,
    vehicleId: b.vehicle._id,
    route: `${b.vehicle.startLocation} -> ${b.vehicle.destination}`,
    passengerName: b.passenger?.name,
    createdAt: b.createdAt,
  }));

  const myBookingsAsPassenger = await Booking.find({ passenger: userId, status: { $in: ["confirmed", "completed"] } }).select("_id");
  const myBookingsAsOwner = await Booking.find({ vehicle: { $in: myVehicleIds }, status: { $in: ["confirmed", "completed"] } }).select("_id");
  const bookingIds = [...myBookingsAsPassenger, ...myBookingsAsOwner].map((b) => b._id);

  const unreadAgg = bookingIds.length
    ? await Message.aggregate([
        { $match: { booking: { $in: bookingIds }, readBy: { $ne: userId }, sender: { $ne: userId } } },
        { $group: { _id: "$booking", count: { $sum: 1 } } },
      ])
    : [];

  let unreadChats = [];
  if (unreadAgg.length) {
    const bookingsWithVehicle = await Booking.find({ _id: { $in: unreadAgg.map((u) => u._id) } })
      .populate("vehicle", "startLocation destination postedBy")
      .populate("passenger", "name");
    unreadChats = unreadAgg.map((u) => {
      const booking = bookingsWithVehicle.find((b) => String(b._id) === String(u._id));
      if (!booking) return null;
      const isOwner = String(booking.vehicle.postedBy) === String(userId);
      return {
        bookingId: booking._id,
        route: `${booking.vehicle.startLocation} -> ${booking.vehicle.destination}`,
        otherPartyLabel: isOwner ? booking.passenger?.name : "Driver",
        unreadCount: u.count,
      };
    }).filter(Boolean);
  }

  res.json({
    success: true,
    data: {
      pendingRequests,
      unreadChats,
      totalCount: pendingRequests.length + unreadChats.length,
    },
  });
});
