import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./src/config/db.js";
import { notFound, errorHandler } from "./src/middleware/errorHandler.js";
import Vehicle from "./src/models/Vehicle.js";
import Booking from "./src/models/Booking.js";

import authRoutes from "./src/routes/authRoutes.js";
import orgRoutes from "./src/routes/orgRoutes.js";
import vehicleRoutes from "./src/routes/vehicleRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import feedbackRoutes from "./src/routes/feedbackRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";

dotenv.config();
await connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
// Raised from 1mb to accommodate small base64-encoded profile photo uploads
// (the frontend resizes/compresses images to well under this before sending).
app.use(express.json({ limit: "4mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Basic rate limiting to keep the API efficient/protected under load
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", limiter);

app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

// Auto-complete trips whose departure time (plus a grace window) has passed,
// so a driver doesn't have to remember to manually close out every trip —
// this covers trips left "ongoing" AND trips the driver never started at all
// (still "available"/"full"), since either way the scheduled time has passed.
// Cascades to confirmed bookings too, same as the manual "completed" path.
// Adjust TRIP_GRACE_HOURS if your typical trip duration is longer/shorter.
const TRIP_GRACE_HOURS = 3;
const autoCompleteExpiredTrips = async () => {
  try {
    const candidates = await Vehicle.find({ status: { $in: ["available", "full", "ongoing"] } });
    const now = Date.now();
    for (const vehicle of candidates) {
      const [h, m] = (vehicle.travelTime || "00:00").split(":").map(Number);
      const departure = new Date(vehicle.travelDate);
      departure.setHours(h || 0, m || 0, 0, 0);
      const cutoff = departure.getTime() + TRIP_GRACE_HOURS * 60 * 60 * 1000;
      if (now >= cutoff) {
        vehicle.status = "completed";
        await vehicle.save();
        // Confirmed bookings actually happened -> completed (passenger can leave feedback).
        await Booking.updateMany(
          { vehicle: vehicle._id, status: "confirmed" },
          { status: "completed", respondedAt: new Date() }
        );
        // Requests the driver never acted on -> auto-rejected, since the trip has passed.
        await Booking.updateMany(
          { vehicle: vehicle._id, status: "requested" },
          { status: "rejected", respondedAt: new Date() }
        );
        console.log(`Auto-completed trip ${vehicle._id} (${vehicle.startLocation} -> ${vehicle.destination})`);
      }
    }
  } catch (err) {
    console.error("autoCompleteExpiredTrips error:", err.message);
  }
};
setInterval(autoCompleteExpiredTrips, 5 * 60 * 1000); // every 5 minutes
autoCompleteExpiredTrips(); // also run once on startup

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Carpool API running on port ${PORT}`));
