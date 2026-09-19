// ============================================================
// Velocity Pool · Carpool Platform — Full Generator
// Backend features: from pasted spec (orgs, memberships, bookings,
//   chat, feedback, notifications, auto-complete, super admin)
// Frontend: my design (Login/Register, Discover, Pending Approval,
//   Bell, Sidebar badges, Admin/SuperAdmin)
// Run: node setup.js
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = 'carpool-platform';

if (fs.existsSync(ROOT)) {
  try {
    fs.rmSync(ROOT, { recursive: true, force: true });
    console.log('🧹 Removed existing carpool-platform folder');
  } catch (e) {
    console.error('❌ Could not delete folder — close VS Code terminals and stop node processes.');
    console.error('   Run: taskkill /IM node.exe /F   then retry.');
    process.exit(1);
  }
}

const write = (p, content) => {
  const full = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.replace(/^\n/, ''), 'utf8');
};

console.log('📁 Generating project files...\n');

// ============================================================
// BACKEND
// ============================================================

write('backend/package.json', `
{
  "name": "carpool-backend",
  "version": "1.0.0",
  "description": "Vehicle Pooling Platform - Backend (Node + Express + MongoDB)",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "seed:superadmin": "node src/utils/seedSuperAdmin.js",
    "seed": "node seed.js",
    "reset": "node reset.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-async-handler": "^1.2.0",
    "express-rate-limit": "^7.4.0",
    "express-validator": "^7.2.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.6.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": { "nodemon": "^3.1.4" }
}
`);

write('backend/.env.example', `
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/carpool_platform

JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d

SUPERADMIN_EMAIL=super@velocity.com
SUPERADMIN_PASSWORD=super123
SUPERADMIN_NAME=Site Owner
`);

write('backend/.env', `
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/carpool_platform

JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d

SUPERADMIN_EMAIL=super@velocity.com
SUPERADMIN_PASSWORD=super123
SUPERADMIN_NAME=Site Owner
`);

write('backend/.gitignore', `
node_modules
.env
*.log
`);

write('backend/server.js', `
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
app.use(express.json({ limit: "4mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

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
        await Booking.updateMany(
          { vehicle: vehicle._id, status: "confirmed" },
          { status: "completed", respondedAt: new Date() }
        );
        await Booking.updateMany(
          { vehicle: vehicle._id, status: "requested" },
          { status: "rejected", respondedAt: new Date() }
        );
        console.log(\`Auto-completed trip \${vehicle._id}\`);
      }
    }
  } catch (err) {
    console.error("autoCompleteExpiredTrips error:", err.message);
  }
};
setInterval(autoCompleteExpiredTrips, 5 * 60 * 1000);
autoCompleteExpiredTrips();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Carpool API running on port \${PORT}\`));
`);

write('backend/src/config/db.js', `
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI is not set in backend/.env");
      process.exit(1);
    }
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(\`MongoDB connected: \${conn.connection.host}\`);
  } catch (err) {
    console.error(\`MongoDB connection error: \${err.message}\`);
    process.exit(1);
  }
};
`);

write('backend/src/models/User.js', `
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true,
      match: [/^\\S+@\\S+\\.\\S+$/, "Please provide a valid email"] },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String, default: "" },
    platformRole: { type: String, enum: ["super_admin", "user"], default: "user" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model("User", userSchema);
`);

write('backend/src/models/Organization.js', `
import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, enum: ["residency", "it_park", "corporate", "college", "other"], default: "other" },
    size: { type: String, enum: ["small", "medium", "large", "enterprise"], default: "medium" },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
organizationSchema.index({ name: "text", location: "text" });

export default mongoose.model("Organization", organizationSchema);
`);

write('backend/src/models/Membership.js', `
import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    role: { type: String, enum: ["org_admin", "member"], default: "member" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);
membershipSchema.index({ user: 1, organization: 1 }, { unique: true });

export default mongoose.model("Membership", membershipSchema);
`);

write('backend/src/models/Vehicle.js', `
import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicleType: { type: String, enum: ["car", "bike", "van", "other"], default: "car" },
    vehicleModel: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true },
    startLocation: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    travelDate: { type: Date, required: true },
    travelTime: { type: String, required: true },
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    farePerSeat: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["available", "full", "ongoing", "completed", "cancelled"],
      default: "available",
    },
  },
  { timestamps: true }
);
vehicleSchema.index({ organization: 1, startLocation: 1, destination: 1, travelDate: 1 });

export default mongoose.model("Vehicle", vehicleSchema);
`);

write('backend/src/models/Booking.js', `
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seatsRequested: { type: Number, required: true, min: 1, default: 1 },
    status: {
      type: String,
      enum: ["requested", "confirmed", "rejected", "cancelled", "completed"],
      default: "requested",
    },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);
bookingSchema.index({ vehicle: 1, passenger: 1 });

export default mongoose.model("Booking", bookingSchema);
`);

write('backend/src/models/Feedback.js', `
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    aboutUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);
feedbackSchema.index({ booking: 1, fromUser: 1 }, { unique: true });

export default mongoose.model("Feedback", feedbackSchema);
`);

write('backend/src/models/Message.js', `
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);
messageSchema.index({ booking: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
`);

write('backend/src/middleware/auth.js', `
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Membership from "../models/Membership.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer")) token = header.split(" ")[1];
  if (!token) { res.status(401); throw new Error("Not authorized, no token"); }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user || !req.user.isActive) { res.status(401); throw new Error("Not authorized"); }
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

export const superAdminOnly = (req, res, next) => {
  if (req.user?.platformRole !== "super_admin") {
    res.status(403);
    throw new Error("Super admin access required");
  }
  next();
};

export const requireOrgMember = asyncHandler(async (req, res, next) => {
  const orgId = req.params.orgId || req.body.organization || req.query.organization;
  if (!orgId) { res.status(400); throw new Error("Organization id is required"); }
  const membership = await Membership.findOne({ user: req.user._id, organization: orgId, status: "approved" });
  if (!membership) { res.status(403); throw new Error("You are not an approved member of this organization"); }
  req.membership = membership;
  next();
});

export const requireOrgAdmin = asyncHandler(async (req, res, next) => {
  const orgId = req.params.orgId || req.body.organization || req.query.organization;
  if (!orgId) { res.status(400); throw new Error("Organization id is required"); }
  const membership = await Membership.findOne({
    user: req.user._id, organization: orgId, status: "approved", role: "org_admin",
  });
  if (!membership && req.user.platformRole !== "super_admin") {
    res.status(403);
    throw new Error("Organization admin access required");
  }
  req.membership = membership;
  next();
});
`);

write('backend/src/middleware/errorHandler.js', `
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(\`Route not found - \${req.originalUrl}\`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
`);

write('backend/src/utils/generateToken.js', `
import jwt from "jsonwebtoken";

export const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
`);

// --- Controllers ---

write('backend/src/controllers/authController.js', `
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

const publicUser = (user) => ({
  id: user._id, name: user.name, email: user.email,
  phone: user.phone, avatar: user.avatar, platformRole: user.platformRole,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) { res.status(400); throw new Error("Name, email and password are required"); }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) { res.status(400); throw new Error("An account with this email already exists"); }
  const user = await User.create({ name, email, password, phone });
  res.status(201).json({ success: true, data: { user: publicUser(user), token: generateToken(user._id) } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error("Email and password are required"); }
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) { res.status(401); throw new Error("Invalid email or password"); }
  if (!user.isActive) { res.status(403); throw new Error("Account deactivated"); }
  res.json({ success: true, data: { user: publicUser(user), token: generateToken(user._id) } });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error("User not found"); }
  if (name !== undefined) { if (!name.trim()) { res.status(400); throw new Error("Name cannot be empty"); } user.name = name.trim(); }
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  res.json({ success: true, data: publicUser(user) });
});
`);

write('backend/src/controllers/orgController.js', `
import asyncHandler from "express-async-handler";
import Organization from "../models/Organization.js";
import Membership from "../models/Membership.js";

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const createOrganization = asyncHandler(async (req, res) => {
  const { name, type, size, description, location } = req.body;
  if (!name) { res.status(400); throw new Error("Organization name is required"); }
  let slug = slugify(name);
  const existingSlug = await Organization.findOne({ slug });
  if (existingSlug) slug = \`\${slug}-\${Date.now().toString(36)}\`;

  const org = await Organization.create({ name, slug, type, size, description, location, createdBy: req.user._id });

  await Membership.create({
    user: req.user._id, organization: org._id, role: "org_admin", status: "approved",
    reviewedBy: req.user._id, reviewedAt: new Date(),
  });

  res.status(201).json({ success: true, data: org });
});

export const listOrganizations = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { isActive: true };
  if (search) filter.$or = [
    { name: { $regex: search, $options: "i" } },
    { location: { $regex: search, $options: "i" } },
  ];
  const orgs = await Organization.find(filter).sort({ createdAt: -1 });

  const withCounts = await Promise.all(orgs.map(async (o) => {
    const memberCount = await Membership.countDocuments({ organization: o._id, status: "approved" });
    return { ...o.toObject(), memberCount };
  }));
  res.json({ success: true, data: withCounts });
});

export const getOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.orgId);
  if (!org) { res.status(404); throw new Error("Organization not found"); }
  res.json({ success: true, data: org });
});

export const requestToJoin = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.orgId);
  if (!org) { res.status(404); throw new Error("Organization not found"); }
  const existing = await Membership.findOne({ user: req.user._id, organization: org._id });
  if (existing) { res.status(400); throw new Error(\`You already have a \${existing.status} request for this organization\`); }
  const membership = await Membership.create({ user: req.user._id, organization: org._id, role: "member", status: "pending" });
  res.status(201).json({ success: true, data: membership });
});

export const myMemberships = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ user: req.user._id }).populate("organization");
  res.json({ success: true, data: memberships });
});

export const listMembers = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { organization: req.params.orgId };
  if (status) filter.status = status;
  const members = await Membership.find(filter).populate("user", "name email phone avatar");
  res.json({ success: true, data: members });
});

export const reviewMembership = asyncHandler(async (req, res) => {
  const { decision } = req.body;
  if (!["approved", "rejected"].includes(decision)) { res.status(400); throw new Error("decision must be 'approved' or 'rejected'"); }
  const membership = await Membership.findOne({ _id: req.params.membershipId, organization: req.params.orgId });
  if (!membership) { res.status(404); throw new Error("Membership request not found"); }
  membership.status = decision;
  membership.reviewedBy = req.user._id;
  membership.reviewedAt = new Date();
  await membership.save();
  res.json({ success: true, data: membership });
});
`);

write('backend/src/controllers/vehicleController.js', `
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
`);

write('backend/src/controllers/bookingController.js', `
import asyncHandler from "express-async-handler";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";

export const createBooking = asyncHandler(async (req, res) => {
  const { vehicleId, seatsRequested = 1 } = req.body;
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) { res.status(404); throw new Error("Vehicle/trip not found"); }
  if (String(vehicle.postedBy) === String(req.user._id)) { res.status(400); throw new Error("You cannot book your own posted trip"); }
  if (vehicle.status !== "available" || vehicle.availableSeats < seatsRequested) {
    res.status(400);
    throw new Error("Not enough available seats for this trip");
  }
  const existing = await Booking.findOne({ vehicle: vehicleId, passenger: req.user._id, status: { $in: ["requested", "confirmed"] } });
  if (existing) { res.status(400); throw new Error("You already have an active request for this trip"); }

  const booking = await Booking.create({
    organization: vehicle.organization, vehicle: vehicle._id,
    passenger: req.user._id, seatsRequested, status: "requested",
  });
  res.status(201).json({ success: true, data: booking });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id).populate("vehicle");
  if (!booking) { res.status(404); throw new Error("Booking not found"); }
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
    if (vehicle.availableSeats < booking.seatsRequested) { res.status(400); throw new Error("Not enough seats remaining"); }
    vehicle.availableSeats -= booking.seatsRequested;
    if (vehicle.availableSeats === 0) vehicle.status = "full";
    await vehicle.save();
  }
  if (status === "cancelled" && booking.status === "confirmed") {
    vehicle.availableSeats += booking.seatsRequested;
    if (vehicle.status === "full") vehicle.status = "available";
    await vehicle.save();
  }

  booking.status = status;
  booking.respondedAt = new Date();
  await booking.save();
  res.json({ success: true, data: booking });
});

export const myBookings = asyncHandler(async (req, res) => {
  const filter = { passenger: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const bookings = await Booking.find(filter)
    .populate({ path: "vehicle", populate: { path: "postedBy", select: "name email phone avatar" } })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});

export const bookingsForVehicle = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ vehicle: req.params.vehicleId })
    .populate("passenger", "name email phone avatar")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});
`);

write('backend/src/controllers/feedbackController.js', `
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
`);

write('backend/src/controllers/messageController.js', `
import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Message from "../models/Message.js";
import Vehicle from "../models/Vehicle.js";

const assertParticipant = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId).populate("vehicle");
  if (!booking) { const e = new Error("Booking not found"); e.statusCode = 404; throw e; }
  const isPassenger = String(booking.passenger) === String(userId);
  const isOwner = String(booking.vehicle.postedBy) === String(userId);
  if (!isPassenger && !isOwner) { const e = new Error("Not authorized to access this chat"); e.statusCode = 403; throw e; }
  if (!["confirmed", "completed"].includes(booking.status)) {
    const e = new Error("Chat is only available for confirmed or completed trips");
    e.statusCode = 400;
    throw e;
  }
  return booking;
};

export const getMessages = asyncHandler(async (req, res) => {
  let booking;
  try { booking = await assertParticipant(req.params.bookingId, req.user._id); }
  catch (e) { res.status(e.statusCode || 500); throw e; }

  const messages = await Message.find({ booking: booking._id }).populate("sender", "name").sort({ createdAt: 1 });
  await Message.updateMany({ booking: booking._id, readBy: { $ne: req.user._id } }, { $addToSet: { readBy: req.user._id } });

  res.json({
    success: true,
    data: {
      messages,
      otherParty: String(booking.passenger) === String(req.user._id)
        ? booking.vehicle.postedBy
        : booking.passenger,
    },
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { bookingId, text } = req.body;
  if (!text || !text.trim()) { res.status(400); throw new Error("Message text is required"); }
  let booking;
  try { booking = await assertParticipant(bookingId, req.user._id); }
  catch (e) { res.status(e.statusCode || 500); throw e; }

  const message = await Message.create({ booking: booking._id, sender: req.user._id, text: text.trim(), readBy: [req.user._id] });
  const populated = await message.populate("sender", "name");
  res.status(201).json({ success: true, data: populated });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const myBookings = await Booking.find({ status: { $in: ["confirmed", "completed"] }, passenger: req.user._id }).select("_id");
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
`);

write('backend/src/controllers/notificationController.js', `
import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import Message from "../models/Message.js";
import Membership from "../models/Membership.js";

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
    route: \`\${b.vehicle.startLocation} -> \${b.vehicle.destination}\`,
    passengerName: b.passenger?.name,
    createdAt: b.createdAt,
  }));

  // Org admin: pending membership requests for their orgs
  const myAdminOrgIds = (await Membership.find({ user: userId, role: "org_admin", status: "approved" }).select("organization"))
    .map((m) => m.organization);
  const pendingMemberships = myAdminOrgIds.length
    ? await Membership.find({ organization: { $in: myAdminOrgIds }, status: "pending" })
        .populate("user", "name")
        .populate("organization", "name")
        .sort({ createdAt: -1 })
    : [];

  const pendingJoinRequests = pendingMemberships.map((m) => ({
    membershipId: m._id,
    organizationId: m.organization._id,
    organizationName: m.organization.name,
    userName: m.user?.name,
    createdAt: m.createdAt,
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
        route: \`\${booking.vehicle.startLocation} -> \${booking.vehicle.destination}\`,
        otherPartyLabel: isOwner ? booking.passenger?.name : "Driver",
        unreadCount: u.count,
      };
    }).filter(Boolean);
  }

  res.json({
    success: true,
    data: {
      pendingRequests,
      pendingJoinRequests,
      unreadChats,
      totalCount: pendingRequests.length + pendingJoinRequests.length + unreadChats.length,
    },
  });
});
`);

write('backend/src/controllers/adminController.js', `
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
`);

// --- Routes ---

write('backend/src/routes/authRoutes.js', `
import express from "express";
import { register, login, getMe, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

export default router;
`);

write('backend/src/routes/orgRoutes.js', `
import express from "express";
import {
  createOrganization, listOrganizations, getOrganization, requestToJoin,
  myMemberships, listMembers, reviewMembership,
} from "../controllers/orgController.js";
import { protect, requireOrgAdmin } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.post("/", createOrganization);
router.get("/", listOrganizations);
router.get("/mine", myMemberships);
router.get("/:orgId", getOrganization);
router.post("/:orgId/join", requestToJoin);
router.get("/:orgId/members", requireOrgAdmin, listMembers);
router.patch("/:orgId/members/:membershipId", requireOrgAdmin, reviewMembership);

export default router;
`);

write('backend/src/routes/vehicleRoutes.js', `
import express from "express";
import {
  createVehicle, searchVehicles, latestVehicles, getVehicle, updateVehicle, myVehicles,
} from "../controllers/vehicleController.js";
import { protect, requireOrgMember } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.get("/latest", latestVehicles);
router.get("/mine", myVehicles);
router.get("/", searchVehicles);
router.post("/", requireOrgMember, createVehicle);
router.get("/:id", getVehicle);
router.patch("/:id", updateVehicle);

export default router;
`);

write('backend/src/routes/bookingRoutes.js', `
import express from "express";
import { createBooking, updateBookingStatus, myBookings, bookingsForVehicle } from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.post("/", createBooking);
router.patch("/:id", updateBookingStatus);
router.get("/mine", myBookings);
router.get("/for-vehicle/:vehicleId", bookingsForVehicle);

export default router;
`);

write('backend/src/routes/feedbackRoutes.js', `
import express from "express";
import { submitFeedback, feedbackForVehicle, feedbackForUser } from "../controllers/feedbackController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.post("/", submitFeedback);
router.get("/vehicle/:vehicleId", feedbackForVehicle);
router.get("/user/:userId", feedbackForUser);

export default router;
`);

write('backend/src/routes/messageRoutes.js', `
import express from "express";
import { getMessages, sendMessage, unreadCount } from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.get("/unread/count", unreadCount);
router.get("/:bookingId", getMessages);
router.post("/", sendMessage);

export default router;
`);

write('backend/src/routes/notificationRoutes.js', `
import express from "express";
import { getSummary } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.get("/summary", getSummary);

export default router;
`);

write('backend/src/routes/adminRoutes.js', `
import express from "express";
import {
  orgStats, orgVehicles, orgVehicleInterest, platformStats, platformOrganizations,
  setOrganizationActive, platformUsers, setUserPlatformRole,
} from "../controllers/adminController.js";
import { protect, requireOrgAdmin, superAdminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/orgs/:orgId/stats", requireOrgAdmin, orgStats);
router.get("/orgs/:orgId/vehicles", requireOrgAdmin, orgVehicles);
router.get("/orgs/:orgId/vehicles/:vehicleId/interest", requireOrgAdmin, orgVehicleInterest);

router.get("/platform/stats", superAdminOnly, platformStats);
router.get("/platform/orgs", superAdminOnly, platformOrganizations);
router.patch("/platform/orgs/:orgId", superAdminOnly, setOrganizationActive);
router.get("/platform/users", superAdminOnly, platformUsers);
router.patch("/platform/users/:userId", superAdminOnly, setUserPlatformRole);

export default router;
`);

write('backend/src/utils/seedSuperAdmin.js', `
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME || "Super Admin";
  let user = await User.findOne({ email });
  if (user) {
    user.platformRole = "super_admin";
    await user.save();
    console.log(\`Existing user \${email} upgraded to super_admin\`);
  } else {
    user = await User.create({ name, email, password, platformRole: "super_admin" });
    console.log(\`Super admin created: \${email}\`);
  }
  await mongoose.disconnect();
  process.exit(0);
};
run();
`);

write('backend/seed.js', `
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Organization from "./src/models/Organization.js";
import Membership from "./src/models/Membership.js";
import Vehicle from "./src/models/Vehicle.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  await User.deleteMany({});
  await Organization.deleteMany({});
  await Membership.deleteMany({});
  await Vehicle.deleteMany({});

  // Superadmin
  await User.create({
    name: "Site Owner", email: "super@velocity.com",
    password: "super123", platformRole: "super_admin",
  });

  // Org 1
  const org1 = await Organization.create({
    name: "Green Ride Co", slug: "green-ride-co", type: "corporate", size: "medium",
    description: "Eco-friendly carpool community",
  });
  const admin1 = await User.create({
    name: "Alex Rivera", email: "admin@greenride.com", password: "admin123", phone: "+91 90000 11111",
  });
  org1.createdBy = admin1._id;
  await org1.save();
  await Membership.create({ user: admin1._id, organization: org1._id, role: "org_admin", status: "approved" });

  const user1 = await User.create({
    name: "Jamie Lee", email: "user@greenride.com", password: "user123", phone: "+91 90000 22222",
  });
  await Membership.create({ user: user1._id, organization: org1._id, role: "member", status: "approved" });

  // Org 2
  const org2 = await Organization.create({
    name: "Metro Poolers", slug: "metro-poolers", type: "residency", size: "large",
    description: "City commuter pooling",
  });
  const admin2 = await User.create({
    name: "Priya Shah", email: "admin@metropool.com", password: "admin123",
  });
  org2.createdBy = admin2._id;
  await org2.save();
  await Membership.create({ user: admin2._id, organization: org2._id, role: "org_admin", status: "approved" });

  // Vehicles
  await Vehicle.insertMany([
    { organization: org1._id, postedBy: admin1._id, vehicleType: "car", vehicleModel: "Toyota Camry", vehicleNumber: "CA 1234",
      startLocation: "Downtown", destination: "Airport", travelDate: new Date(Date.now() + 86400000),
      travelTime: "08:30", totalSeats: 5, availableSeats: 4, farePerSeat: 12, status: "available" },
    { organization: org1._id, postedBy: admin1._id, vehicleType: "van", vehicleModel: "Ford Transit", vehicleNumber: "TX 9012",
      startLocation: "Uptown", destination: "Tech Park", travelDate: new Date(Date.now() + 2 * 86400000),
      travelTime: "07:00", totalSeats: 8, availableSeats: 6, farePerSeat: 8, status: "available" },
    { organization: org2._id, postedBy: admin2._id, vehicleType: "suv", vehicleModel: "Honda CR-V", vehicleNumber: "NY 5678",
      startLocation: "North Side", destination: "City Center", travelDate: new Date(Date.now() + 86400000),
      travelTime: "09:00", totalSeats: 5, availableSeats: 3, farePerSeat: 10, status: "available" },
  ]);

  console.log("\\n✅ Seed complete!\\n");
  console.log("Login credentials:");
  console.log("  Superadmin:  super@velocity.com  /  super123");
  console.log("  Admin 1:     admin@greenride.com /  admin123");
  console.log("  Admin 2:     admin@metropool.com /  admin123");
  console.log("  Normal user: user@greenride.com  /  user123\\n");

  await mongoose.disconnect();
  process.exit(0);
};
run().catch((e) => { console.error(e); process.exit(1); });
`);

write('backend/reset.js', `
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Organization from "./src/models/Organization.js";
import Membership from "./src/models/Membership.js";
import Vehicle from "./src/models/Vehicle.js";
import Booking from "./src/models/Booking.js";
import Message from "./src/models/Message.js";
import Feedback from "./src/models/Feedback.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB\\n");

  const results = await Promise.all([
    User.deleteMany({}), Organization.deleteMany({}), Membership.deleteMany({}),
    Vehicle.deleteMany({}), Booking.deleteMany({}), Message.deleteMany({}), Feedback.deleteMany({}),
  ]);

  console.log("🗑️  Deleted:");
  const labels = ["Users", "Organizations", "Memberships", "Vehicles", "Bookings", "Messages", "Feedback"];
  results.forEach((r, i) => console.log(\`   \${labels[i]}: \${r.deletedCount}\`));

  await User.create({
    name: "Site Owner", email: "super@velocity.com",
    password: "super123", platformRole: "super_admin",
  });

  console.log("\\n✅ Fresh superadmin created:");
  console.log("   Email:    super@velocity.com");
  console.log("   Password: super123\\n");

  await mongoose.disconnect();
  process.exit(0);
};
run().catch((e) => { console.error("❌ Error:", e.message); process.exit(1); });
`);

// ============================================================
// FRONTEND
// ============================================================

write('frontend/package.json', `
{
  "name": "carpool-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "lucide-react": "^0.446.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "vite": "^5.4.3"
  }
}
`);

write('frontend/.env.example', `
VITE_API_URL=http://localhost:5000/api
`);

write('frontend/.env', `
VITE_API_URL=http://localhost:5000/api
`);

write('frontend/.gitignore', `
node_modules
dist
.env
`);

write('frontend/index.html', `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Velocity Pool · Vehicle Pooling Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

write('frontend/vite.config.js', `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: { "/api": { target: "http://localhost:5000", changeOrigin: true } },
  },
});
`);

write('frontend/tailwind.config.js', `
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0B2B4F", light: "#1D4A7A" },
        accent: { DEFAULT: "#00A3C4", soft: "#E6F7FC" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
`);

write('frontend/postcss.config.js', `
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
`);

write('frontend/src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #F8FAFC;
  color: #0F172A;
  -webkit-font-smoothing: antialiased;
}

.status-badge { @apply absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white shadow-sm; }
.status-pending { @apply bg-amber-500; }
.status-approved { @apply bg-emerald-500; }
.status-rejected { @apply bg-rose-500; }
.status-available { @apply bg-blue-500; }
.status-full { @apply bg-slate-500; }
.status-requested { @apply bg-violet-500; }
.status-confirmed { @apply bg-cyan-500; }
.status-ongoing { @apply bg-orange-500; }
.status-completed { @apply bg-slate-500; }
.status-cancelled { @apply bg-rose-500; }

.btn { @apply inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition; }
.btn-primary { @apply bg-accent text-white shadow-md hover:bg-[#008fad] hover:-translate-y-0.5; }
.btn-outline { @apply bg-transparent border border-slate-200 text-slate-800 hover:bg-slate-100; }
`);

write('frontend/src/main.jsx', `
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationsProvider } from "./context/NotificationsContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
`);

write('frontend/src/api/axios.js', `
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("cp_token");
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem("cp_token");
      sessionStorage.removeItem("cp_user");
      sessionStorage.removeItem("cp_active_org");
      if (!window.location.pathname.startsWith("/login") && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
`);

// --- Contexts ---

write('frontend/src/context/AuthContext.jsx', `
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("cp_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [activeOrg, setActiveOrg] = useState(() => {
    const stored = sessionStorage.getItem("cp_active_org");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    sessionStorage.setItem("cp_token", data.data.token);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    sessionStorage.setItem("cp_token", data.data.token);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = () => {
    sessionStorage.removeItem("cp_token");
    sessionStorage.removeItem("cp_user");
    sessionStorage.removeItem("cp_active_org");
    setUser(null);
    setActiveOrg(null);
  };

  const chooseOrg = (org, membership) => {
    const value = { org, membership };
    sessionStorage.setItem("cp_active_org", JSON.stringify(value));
    setActiveOrg(value);
  };

  const refreshActiveOrg = async () => {
    const { data } = await api.get("/orgs/mine");
    const stored = sessionStorage.getItem("cp_active_org");
    const prev = stored ? JSON.parse(stored) : null;
    if (prev?.org?._id) {
      const match = data.data.find((m) => m.organization?._id === prev.org._id);
      if (match) chooseOrg(match.organization, match);
    }
  };

  const refreshUser = async () => {
    const { data } = await api.get("/auth/me");
    sessionStorage.setItem("cp_user", JSON.stringify(data.data));
    setUser(data.data);
    return data.data;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.patch("/auth/profile", payload);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data));
    setUser(data.data);
    return data.data;
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, login, register, logout, loading, setLoading,
      activeOrg, chooseOrg, updateProfile, refreshUser, refreshActiveOrg,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`);

write('frontend/src/context/NotificationsContext.jsx', `
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);
  const [unreadChats, setUnreadChats] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setPendingRequests([]);
      setPendingJoinRequests([]);
      setUnreadChats([]);
      return;
    }
    try {
      const { data } = await api.get("/notifications/summary");
      setPendingRequests(data.data.pendingRequests || []);
      setPendingJoinRequests(data.data.pendingJoinRequests || []);
      setUnreadChats(data.data.unreadChats || []);
    } catch {}
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [user, refresh]);

  const hasUnreadChat = (bookingId) =>
    unreadChats.some((c) => String(c.bookingId) === String(bookingId));

  const totalCount = pendingRequests.length + pendingJoinRequests.length + unreadChats.length;

  return (
    <NotificationsContext.Provider value={{
      pendingRequests, pendingJoinRequests, unreadChats, totalCount, hasUnreadChat, refresh,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
`);

// --- Components ---

write('frontend/src/components/Toast.jsx', `
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, key: Date.now() });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div key={toast.key}
          className={\`fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-[1000] flex items-center gap-2.5 px-5 py-3 rounded-full shadow-lg font-medium text-sm text-white \${toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"}\`}>
          {toast.type === "error" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
`);

write('frontend/src/components/ConfirmModal.jsx', `
import { HelpCircle } from "lucide-react";

export default function ConfirmModal({ open, title, message, confirmLabel = "Yes, confirm", danger = false, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <HelpCircle className={\`w-10 h-10 mx-auto mb-3 \${danger ? "text-rose-500" : "text-accent"}\`} />
        <h3 className="text-lg font-bold text-primary mb-1.5">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="btn btn-outline !py-2 !px-4">Cancel</button>
          <button onClick={onConfirm}
            className={\`px-4 py-2 rounded-md text-white text-sm font-medium \${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-accent hover:bg-[#008fad]"}\`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
`);

write('frontend/src/components/Avatar.jsx', `
export default function Avatar({ user, size = 36, className = "" }) {
  const initials = (user?.name || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (user?.avatar) {
    return <img src={user.avatar} alt={user.name} style={style}
      className={\`rounded-full object-cover border border-slate-200 \${className}\`} />;
  }
  return (
    <div style={style}
      className={\`rounded-full bg-accent text-white flex items-center justify-center font-semibold \${className}\`}>
      {initials}
    </div>
  );
}
`);

write('frontend/src/components/StatusBadge.jsx', `
const STYLES = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  available: "bg-emerald-100 text-emerald-700",
  full: "bg-slate-200 text-slate-700",
  requested: "bg-amber-100 text-amber-700",
  confirmed: "bg-cyan-100 text-cyan-700",
  ongoing: "bg-orange-100 text-orange-700",
  completed: "bg-slate-200 text-slate-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={\`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize \${style}\`}>
      {status}
    </span>
  );
}
`);

write('frontend/src/components/ProtectedRoute.jsx', `
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, requireOrg = false, allowedRoles }) {
  const { user, activeOrg } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles) {
    const effectiveRole = user.platformRole === "super_admin" ? "super_admin"
      : activeOrg?.membership?.role === "org_admin" ? "org_admin" : "user";
    if (!allowedRoles.includes(effectiveRole)) return <Navigate to="/" replace />;
  }
  if (requireOrg && !activeOrg?.org) return <Navigate to="/organizations" replace />;
  return children;
}
`);

write('frontend/src/components/NotificationBell.jsx', `
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, UserPlus, MessageCircle, UserCheck } from "lucide-react";
import { useNotifications } from "../context/NotificationsContext.jsx";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return \`\${m}m ago\`;
  const h = Math.floor(m / 60);
  if (h < 24) return \`\${h}h ago\`;
  return \`\${Math.floor(h / 24)}d ago\`;
}

export default function NotificationBell() {
  const { pendingRequests, pendingJoinRequests, unreadChats, totalCount } = useNotifications() || {};
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} aria-label="Notifications"
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100">
        <Bell className="w-5 h-5" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-[28rem] overflow-y-auto">
          {(!pendingRequests?.length && !pendingJoinRequests?.length && !unreadChats?.length) ? (
            <div className="p-6 text-sm text-slate-400 text-center">You're all caught up.</div>
          ) : (
            <>
              {pendingJoinRequests?.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Membership requests
                  </div>
                  {pendingJoinRequests.map((r) => (
                    <Link key={r.membershipId} to="/admin/members" onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                        {r.userName} wants to join
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.organizationName} · {timeAgo(r.createdAt)}</div>
                    </Link>
                  ))}
                </div>
              )}
              {pendingRequests?.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Seat requests
                  </div>
                  {pendingRequests.map((r) => (
                    <Link key={r.bookingId} to={\`/vehicles/\${r.vehicleId}\`} onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-amber-500" />
                        {r.passengerName} wants a seat
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.route} · {timeAgo(r.createdAt)}</div>
                    </Link>
                  ))}
                </div>
              )}
              {unreadChats?.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Unread messages
                  </div>
                  {unreadChats.map((c) => (
                    <Link key={c.bookingId} to={\`/chat/\${c.bookingId}\`} onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-cyan-500" />
                        {c.otherPartyLabel} · {c.unreadCount} new
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.route}</div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
          <Link to="/notifications" onClick={() => setOpen(false)}
            className="block text-center text-sm font-semibold text-accent py-2.5 border-t border-slate-100 hover:bg-slate-50">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
`);

write('frontend/src/components/Navbar.jsx', `
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Shield, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import Avatar from "./Avatar.jsx";

export default function Navbar() {
  const { user, logout, activeOrg } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visitCount = useRef(0);
  const [canGoBack, setCanGoBack] = useState(false);
  useEffect(() => {
    visitCount.current += 1;
    setCanGoBack(visitCount.current > 1);
  }, [location]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <nav className="bg-primary text-white border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} disabled={!canGoBack} aria-label="Go back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 disabled:opacity-30">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </span>
            Velocity Pool
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {activeOrg?.org && (
            <span className="hidden sm:inline text-white/70">
              <span className="text-white/50">Community:</span>{" "}
              <span className="font-medium text-white">{activeOrg.org.name}</span>
            </span>
          )}
          {activeOrg?.membership?.role === "org_admin" && (
            <Link to="/admin" className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 font-medium">
              Admin
            </Link>
          )}
          {user?.platformRole === "super_admin" && (
            <Link to="/superadmin" className="px-3 py-1.5 rounded-md border border-white/30 hover:bg-white/10 font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Super Admin
            </Link>
          )}
          {user ? (
            <>
              <NotificationBell />
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu"
                  className="rounded-full hover:ring-2 hover:ring-white/20">
                  <Avatar user={user} size={34} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-lg z-50 py-1">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="text-sm font-medium truncate">{user.name}</div>
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                    </div>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-slate-50">Edit profile</Link>
                    <Link to="/organizations" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-slate-50">Switch community</Link>
                    <button onClick={() => { setMenuOpen(false); logout(); navigate("/"); }}
                      className="block w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 rounded-md hover:bg-white/10">Login</Link>
              <Link to="/register" className="px-3 py-1.5 rounded-md bg-accent text-white hover:bg-[#008fad]">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
`);

write('frontend/src/components/Sidebar.jsx', `
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Search, PlusCircle, CheckCircle2, Navigation,
  Inbox, Flag, Shield, Users, Car, Circle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";

const ICONS = {
  "/dashboard": LayoutDashboard,
  "/vehicles/search": Search,
  "/vehicles/post": PlusCircle,
  "/trips/confirmed": CheckCircle2,
  "/trips/ongoing": Navigation,
  "/trips/requests": Inbox,
  "/trips/completed": Flag,
  "/admin": Shield,
  "/admin/members": Users,
  "/admin/vehicles": Car,
};
const iconFor = (to) => ICONS[to] || Circle;

const desktopButtonClass = ({ isActive }) =>
  \`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors \${
    isActive ? "bg-accent border-accent text-white" : "bg-white border-slate-200 text-slate-600 hover:border-accent hover:bg-accent-soft"
  }\`;

const mobileButtonClass = ({ isActive }) =>
  \`flex flex-col items-center justify-center gap-0.5 shrink-0 w-16 py-1.5 rounded-lg text-[11px] font-medium \${
    isActive ? "bg-accent text-white" : "text-slate-500"
  }\`;

export default function Sidebar({ links }) {
  const { activeOrg } = useAuth();
  const { pendingJoinRequests, totalCount } = useNotifications() || {};
  const location = useLocation();
  const isOrgAdmin = activeOrg?.membership?.role === "org_admin";
  const onAdminPages = location.pathname.startsWith("/admin");
  const pendingMembers = (pendingJoinRequests || []).length;

  const switchLink = isOrgAdmin
    ? onAdminPages
      ? { to: "/dashboard", label: "Dashboard" }
      : { to: "/admin", label: "Admin Panel" }
    : null;
  const allLinks = switchLink ? [...links, switchLink] : links;

  const badgeFor = (to) => {
    if (to === "/admin/members" && pendingMembers > 0) return pendingMembers;
    if (to === "/dashboard" && totalCount > 0) return totalCount;
    if (to === "/admin" && pendingMembers > 0) return pendingMembers;
    return null;
  };

  return (
    <>
      <aside className="hidden sm:block w-56 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-3 space-y-1.5">
        {links.map((l) => {
          const Icon = iconFor(l.to);
          const badge = badgeFor(l.to);
          return (
            <NavLink key={l.to} to={l.to} className={desktopButtonClass} end={l.end}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{l.label}</span>
              {badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </NavLink>
          );
        })}
        {switchLink && (
          <>
            <div className="pt-2 mt-2 border-t border-slate-200" />
            <NavLink to={switchLink.to} className={desktopButtonClass}>
              <Shield className="w-4 h-4 shrink-0" />
              {switchLink.label}
            </NavLink>
          </>
        )}
      </aside>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex gap-1 overflow-x-auto">
        {allLinks.map((l) => {
          const Icon = iconFor(l.to);
          return (
            <NavLink key={l.to} to={l.to} className={mobileButtonClass} end={l.end}>
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[60px]">{l.label.split(" ")[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
`);

write('frontend/src/components/VehicleCard.jsx', `
import { Link } from "react-router-dom";
import { MapPin, Flag, Calendar, Clock, Users, IndianRupee } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import Avatar from "./Avatar.jsx";

const TYPE_EMOJI = { car: "🚗", bike: "🏍️", van: "🚐", other: "🚙" };

export default function VehicleCard({ vehicle, actionLabel = "View details" }) {
  const seatsLeft = vehicle.availableSeats;
  const isScarce = vehicle.status === "available" && seatsLeft > 0 && seatsLeft <= 1;
  const isFree = !vehicle.farePerSeat || vehicle.farePerSeat === 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          <span>{TYPE_EMOJI[vehicle.vehicleType] || "🚙"}</span>
          {vehicle.vehicleType}
        </span>
        <StatusBadge status={vehicle.status} />
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
        <MapPin className="w-4 h-4 text-emerald-600" />
        <span className="truncate">{vehicle.startLocation}</span>
        <span className="text-slate-400">→</span>
        <Flag className="w-4 h-4 text-rose-600" />
        <span className="truncate">{vehicle.destination}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(vehicle.travelDate).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {vehicle.travelTime}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="flex items-center gap-1 text-slate-600">
          <Users className="w-4 h-4 text-slate-400" />
          {vehicle.availableSeats}/{vehicle.totalSeats} seats
        </span>
        {isFree ? (
          <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">Free ride</span>
        ) : (
          <span className="flex items-center font-semibold text-emerald-600">
            <IndianRupee className="w-3.5 h-3.5" />
            {vehicle.farePerSeat}/seat
          </span>
        )}
      </div>

      {isScarce && (
        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full w-fit mb-2">
          🔥 Only 1 seat left
        </span>
      )}

      {vehicle.postedBy?.name && (
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 mb-3">
          <Avatar user={vehicle.postedBy} size={20} />
          Posted by {vehicle.postedBy.name}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-auto pt-1">
        {vehicle.status === "available" && (
          <Link to={\`/vehicles/\${vehicle._id}#request\`}
            className="w-full text-center px-3 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-[#008fad]">
            Request seat
          </Link>
        )}
        <Link to={\`/vehicles/\${vehicle._id}\`}
          className={\`w-full text-center px-3 py-2 rounded-md text-sm font-medium \${
            vehicle.status === "available"
              ? "border border-slate-300 text-slate-600 hover:bg-slate-50"
              : "bg-accent text-white hover:bg-[#008fad]"
          }\`}>
          {actionLabel === "Request / View details" ? "View details" : actionLabel}
        </Link>
      </div>
    </div>
  );
}
`);

// --- Pages ---

write('frontend/src/App.jsx', `
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import OrgSelect from "./pages/OrgSelect.jsx";
import CreateOrg from "./pages/CreateOrg.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import Profile from "./pages/Profile.jsx";
import PostVehicle from "./pages/PostVehicle.jsx";
import SearchVehicles from "./pages/SearchVehicles.jsx";
import VehicleDetails from "./pages/VehicleDetails.jsx";
import TripsList from "./pages/TripsList.jsx";
import OngoingTrips from "./pages/OngoingTrips.jsx";
import Feedback from "./pages/Feedback.jsx";
import Chat from "./pages/Chat.jsx";
import AdminDashboard, { MembershipRequests, AdminVehicles } from "./pages/AdminDashboard.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import Notifications from "./pages/Notifications.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/organizations" element={<ProtectedRoute><OrgSelect /></ProtectedRoute>} />
          <Route path="/organizations/create" element={<ProtectedRoute><CreateOrg /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/superadmin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute requireOrg><UserDashboard /></ProtectedRoute>} />
          <Route path="/vehicles/post" element={<ProtectedRoute requireOrg><PostVehicle /></ProtectedRoute>} />
          <Route path="/vehicles/search" element={<ProtectedRoute requireOrg><SearchVehicles /></ProtectedRoute>} />
          <Route path="/vehicles/:id" element={<ProtectedRoute requireOrg><VehicleDetails /></ProtectedRoute>} />

          <Route path="/trips/confirmed" element={<ProtectedRoute requireOrg><TripsList status="confirmed" title="Confirmed Trips" /></ProtectedRoute>} />
          <Route path="/trips/ongoing" element={<ProtectedRoute requireOrg><OngoingTrips /></ProtectedRoute>} />
          <Route path="/trips/requests" element={<ProtectedRoute requireOrg><TripsList status="requested" title="My Requests" /></ProtectedRoute>} />
          <Route path="/trips/completed" element={<ProtectedRoute requireOrg><TripsList status="completed" title="Completed Trips" /></ProtectedRoute>} />
          <Route path="/feedback/:bookingId" element={<ProtectedRoute requireOrg><Feedback /></ProtectedRoute>} />
          <Route path="/chat/:bookingId" element={<ProtectedRoute requireOrg><Chat /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute requireOrg><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute requireOrg><MembershipRequests /></ProtectedRoute>} />
          <Route path="/admin/vehicles" element={<ProtectedRoute requireOrg><AdminVehicles /></ProtectedRoute>} />

          <Route path="*" element={<div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-500">Page not found.</div>} />
        </Routes>
      </main>
    </div>
  );
}
`);

write('frontend/src/pages/Home.jsx', `
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  return (
    <div>
      <section className="bg-gradient-to-b from-accent-soft to-white">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary leading-tight">
            Vehicle Pooling, <span className="text-accent">Community by Community</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Velocity Pool connects people within your residency, tech park or company into
            independent, admin-managed pooling communities — so you always ride with people you trust.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            {user ? (
              <Link to="/organizations" className="btn btn-primary">Choose your community</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
                <Link to="/login" className="btn btn-outline">Login</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10 text-primary">How it works</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            ["1. Pick a community", "Join an existing pooling server for your residency or workplace, or start a new one."],
            ["2. Get approved", "The community admin reviews and approves your membership request."],
            ["3. Post or search", "Offer a seat in your vehicle, or search trips others have posted."],
            ["4. Ride & rate", "Book a seat, complete the trip, and leave feedback for the driver."],
          ].map(([title, body]) => (
            <div key={title} className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-primary mb-2">{title}</h3>
              <p className="text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 grid sm:grid-cols-3 gap-8 text-center">
          {[
            ["Save money", "Split fuel and toll costs with people on the same route."],
            ["Cut congestion", "Fewer vehicles on the road for the same commute."],
            ["Ride with your community", "Every organization has its own private, admin-moderated pool."],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-white/70 text-sm">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3 text-primary">Every organization gets its own pooling server</h2>
        <p className="text-slate-600 max-w-2xl mx-auto mb-6">
          e.g. "ABC Residency Pooling" and "BA IT Park Pooling" run as fully independent
          communities — separate users, admins, vehicles and trips.
        </p>
        <Link to={user ? "/organizations" : "/register"} className="btn btn-primary inline-block">
          Find or create your community
        </Link>
      </section>
    </div>
  );
}
`);

write('frontend/src/pages/Login.jsx', `
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Car, Users2, MapPinned } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\\S+@\\S+\\.\\S+$/.test(form.email)) return setError("Please enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    try {
      setLoading(true);
      await login(form.email, form.password);
      navigate("/organizations");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row">
        <div className="hidden sm:flex sm:w-2/5 bg-gradient-to-br from-primary to-primary-light text-white p-8 flex-col justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">V</span>
            Velocity Pool
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-snug mb-3">Ride with people you actually know.</h2>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li className="flex items-center gap-2"><Car className="w-4 h-4 shrink-0" /> Every community runs its own pooling server</li>
              <li className="flex items-center gap-2"><Users2 className="w-4 h-4 shrink-0" /> Admin-approved, private membership</li>
              <li className="flex items-center gap-2"><MapPinned className="w-4 h-4 shrink-0" /> Route-based trip search & requests</li>
            </ul>
          </div>
          <div className="text-white/40 text-xs">© {new Date().getFullYear()} Velocity Pool</div>
        </div>

        <div className="flex-1 p-6 sm:p-8">
          <h1 className="text-2xl font-bold mb-1 text-primary">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-6">Sign in to continue to your dashboard.</p>
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="••••••••" />
              </div>
            </div>
            <button disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60">
              <LogIn className="w-4 h-4" />
              {loading ? "Logging in..." : "Login"}
            </button>
            <p className="text-sm text-center text-slate-500">
              New here? <Link to="/register" className="text-accent font-medium">Create an account</Link>
            </p>

            <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-400">
              <p className="font-semibold text-slate-500 mb-2">Demo accounts:</p>
              <p><code>super@velocity.com</code> / <code>super123</code> — Super Admin</p>
              <p><code>admin@greenride.com</code> / <code>admin123</code> — Org Admin</p>
              <p><code>user@greenride.com</code> / <code>user123</code> — Regular User</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
`);

write('frontend/src/pages/Register.jsx', `
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, UserPlus, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!/^\\S+@\\S+\\.\\S+$/.test(form.email)) return setError("Please enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    try {
      setLoading(true);
      await register(form);
      navigate("/organizations");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <span className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center text-xl font-bold mb-3">V</span>
          <h1 className="text-2xl font-bold text-primary">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join Velocity Pool in seconds.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="+91 90000 00000" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="At least 6 characters" />
            </div>
          </div>

          <button disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60">
            <UserPlus className="w-4 h-4" />
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="text-sm text-center text-slate-500">
            Already have an account? <Link to="/login" className="text-accent font-medium">Login</Link>
          </p>
          <p className="text-xs text-center text-slate-400 pt-2 border-t border-slate-100 mt-4">
            After registering, you'll choose an existing community to join — or create a new one
            and become its admin.
          </p>
        </form>
      </div>
    </div>
  );
}
`);

write('frontend/src/pages/OrgSelect.jsx', `
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Building2, PlusCircle, Users } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useToast } from "../components/Toast.jsx";

export default function OrgSelect() {
  const { chooseOrg } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [orgsRes, memRes] = await Promise.all([
        api.get("/orgs", { params: search ? { search } : {} }),
        api.get("/orgs/mine"),
      ]);
      setOrgs(orgsRes.data.data);
      setMyMemberships(memRes.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const membershipFor = (orgId) => myMemberships.find((m) => m.organization?._id === orgId);

  const join = async (org) => {
    setMsg("");
    try {
      await api.post(\`/orgs/\${org._id}/join\`);
      setMsg(\`Request sent to join "\${org.name}". Awaiting admin approval.\`);
      showToast(\`Request sent to \${org.name}\`);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not send join request.");
    }
  };

  const enter = (m) => { chooseOrg(m.organization, m); navigate("/dashboard"); };

  const approved = myMemberships.filter((m) => m.status === "approved");

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2 text-primary">Choose your pooling community</h1>
      <p className="text-slate-600 mb-6">Join an existing community or start a brand new pooling server.</p>

      {approved.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-3 text-slate-700">Your communities</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {approved.map((m) => (
              <button key={m._id} onClick={() => enter(m)}
                className="text-left bg-white border border-slate-200 rounded-lg p-4 hover:border-accent hover:shadow-sm transition">
                <div className="font-medium text-slate-800">{m.organization?.name}</div>
                <div className="text-xs text-slate-500 mt-1 capitalize">{m.role.replace("_", " ")}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-700">Search existing communities</h2>
        <Link to="/organizations/create"
          className="text-sm px-4 py-2 rounded-md bg-accent text-white font-medium hover:bg-[#008fad] flex items-center gap-1.5">
          <Building2 className="w-4 h-4" />
          Create new community
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search by name or location, e.g. 'Green Ride'"
            className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <button onClick={load}
          className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700">
          Search
        </button>
      </div>

      {msg && <div className="bg-accent-soft text-primary text-sm px-3 py-2 rounded-md mb-4">{msg}</div>}

      {loading ? (
        <div className="text-slate-500">Loading communities...</div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No communities found</h3>
          <p className="text-slate-500 text-sm mb-5">Be the first to create one for your workplace or neighbourhood.</p>
          <Link to="/organizations/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-[#008fad]">
            <PlusCircle className="w-4 h-4" /> Create community
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {orgs.map((org) => {
            const m = membershipFor(org._id);
            return (
              <div key={org._id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-800">{org.name}</div>
                  {m && <StatusBadge status={m.status} />}
                </div>
                <div className="text-xs text-slate-500 mt-1 capitalize">
                  {org.type?.replace("_", " ")} · {org.size}
                </div>
                {org.location && <div className="text-xs text-slate-400 mt-1">{org.location}</div>}
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {org.memberCount || 0} members
                  </span>
                </div>
                <div className="mt-3">
                  {!m && (
                    <button onClick={() => join(org)}
                      className="text-sm px-3 py-1.5 rounded-md bg-accent text-white hover:bg-[#008fad]">
                      Request to join
                    </button>
                  )}
                  {m?.status === "approved" && (
                    <button onClick={() => enter(m)}
                      className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700">
                      Enter community
                    </button>
                  )}
                  {m?.status === "pending" && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      ⏳ Waiting for admin approval
                    </span>
                  )}
                  {m?.status === "rejected" && (
                    <span className="text-xs text-rose-500">Your request was rejected</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
`);

write('frontend/src/pages/CreateOrg.jsx', `
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Layers, Users2, MapPin, FileText, PlusCircle } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function CreateOrg() {
  const navigate = useNavigate();
  const { chooseOrg } = useAuth();
  const [form, setForm] = useState({ name: "", type: "residency", size: "medium", description: "", location: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Community name is required.");
    try {
      setLoading(true);
      const { data } = await api.post("/orgs", form);
      chooseOrg(data.data, { role: "org_admin", status: "approved" });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create organization.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2 text-primary">Create a new pooling community</h1>
      <p className="text-slate-600 mb-6">
        This creates an independent pooling server with its own users, admin and trips. You'll become its admin.
      </p>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Organization / community name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g. Green Ride Co" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Type</label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="residency">Residency</option>
                <option value="it_park">IT Park</option>
                <option value="corporate">Corporate</option>
                <option value="college">College</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Community size</label>
            <div className="relative">
              <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="small">Small (&lt;50)</option>
                <option value="medium">Medium (50-500)</option>
                <option value="large">Large (500-2000)</option>
                <option value="enterprise">Enterprise (2000+)</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="City / area" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Description</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              rows={3} />
          </div>
        </div>
        <button disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60">
          <PlusCircle className="w-4 h-4" />
          {loading ? "Creating..." : "Create pooling community"}
        </button>
      </form>
    </div>
  );
}
`);

write('frontend/src/pages/UserDashboard.jsx', `
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import VehicleCard from "../components/VehicleCard.jsx";

const links = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/vehicles/search", label: "Search Vehicles" },
  { to: "/vehicles/post", label: "Post a Vehicle" },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip" },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

export default function UserDashboard() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const [latest, setLatest] = useState([]);
  const [counts, setCounts] = useState({ confirmed: 0, requested: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      setLoading(true);
      const [latestRes, confirmedRes, requestedRes, completedRes] = await Promise.all([
        api.get("/vehicles/latest", { params: { organization: orgId, limit: 6 } }),
        api.get("/bookings/mine", { params: { status: "confirmed" } }),
        api.get("/bookings/mine", { params: { status: "requested" } }),
        api.get("/bookings/mine", { params: { status: "completed" } }),
      ]);
      setLatest(latestRes.data.data);
      setCounts({
        confirmed: confirmedRes.data.data.length,
        requested: requestedRes.data.data.length,
        completed: completedRes.data.data.length,
      });
      setLoading(false);
    })();
  }, [orgId]);

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-1 text-primary">Welcome back</h1>
        <p className="text-slate-500 mb-6">{activeOrg?.org?.name} community dashboard</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            ["Confirmed trips", counts.confirmed, "/trips/confirmed"],
            ["Pending requests", counts.requested, "/trips/requests"],
            ["Completed trips", counts.completed, "/trips/completed"],
          ].map(([label, value, to]) => (
            <Link key={label} to={to} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-accent transition">
              <div className="text-3xl font-bold text-primary">{value}</div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-slate-700">Latest posted vehicles</h2>
          <Link to="/vehicles/search" className="text-sm text-accent font-medium">See all →</Link>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : latest.length === 0 ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            No vehicles posted yet in this community.{" "}
            <Link to="/vehicles/post" className="text-accent font-medium">Post the first one</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latest.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
          </div>
        )}
      </div>
    </div>
  );
}
`);

write('frontend/src/pages/PostVehicle.jsx', `
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Hash, MapPin, Flag, Calendar, Clock, Users, IndianRupee, FileText, Send } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";

const links = [
  { to: "/dashboard", label: "Overview" },
  { to: "/vehicles/search", label: "Search Vehicles" },
  { to: "/vehicles/post", label: "Post a Vehicle", end: true },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip" },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

export default function PostVehicle() {
  const { activeOrg } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    vehicleType: "car", vehicleModel: "", vehicleNumber: "",
    startLocation: "", destination: "", travelDate: "", travelTime: "",
    totalSeats: 3, farePerSeat: 0, notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.startLocation || !form.destination || !form.travelDate || !form.travelTime) {
      return setError("Please fill in route, date and time.");
    }
    try {
      setLoading(true);
      await api.post("/vehicles", { ...form, organization: activeOrg.org._id });
      setSuccess("Trip posted! It is now visible to other members of your community.");
      setTimeout(() => navigate("/vehicles/search"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Could not post trip.");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-1 text-primary">Post a vehicle for pooling</h1>
        <p className="text-slate-500 mb-6">Share your trip so others in {activeOrg?.org?.name} can join.</p>

        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}
          {success && <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-md">✓ {success}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Vehicle type</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="car">Car</option><option value="bike">Bike</option>
                  <option value="van">Van</option><option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Vehicle model</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g. Honda City" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Vehicle number</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g. TN 59 AB 1234" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Starting location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.startLocation} onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Destination</label>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Travel date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="date" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Travel time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="time" value={form.travelTime} onChange={(e) => setForm({ ...form, travelTime: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Available seats</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" min={1} value={form.totalSeats}
                  onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Fare per seat (₹, optional)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" min={0} value={form.farePerSeat}
                  onChange={(e) => setForm({ ...form, farePerSeat: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Notes (optional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                rows={2} />
            </div>
          </div>

          <button disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60">
            <Send className="w-4 h-4" />
            {loading ? "Posting..." : "Post this trip"}
          </button>
        </form>
      </div>
    </div>
  );
}
`);

write('frontend/src/pages/SearchVehicles.jsx', `
import { useEffect, useState } from "react";
import { MapPin, Flag, Calendar, Users, Search as SearchIcon } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import VehicleCard from "../components/VehicleCard.jsx";

const links = [
  { to: "/dashboard", label: "Overview" },
  { to: "/vehicles/search", label: "Search Vehicles", end: true },
  { to: "/vehicles/post", label: "Post a Vehicle" },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip" },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

export default function SearchVehicles() {
  const { activeOrg } = useAuth();
  const [filters, setFilters] = useState({ startLocation: "", destination: "", date: "", minSeats: "" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = async () => {
    setLoading(true);
    try {
      const params = { organization: activeOrg.org._id };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await api.get("/vehicles", { params });
      setResults(data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { search(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-1 text-primary">Search vehicles</h1>
        <p className="text-slate-500 mb-6">Find a pooling trip in {activeOrg?.org?.name}.</p>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 grid sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600">From</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={filters.startLocation} onChange={(e) => setFilters({ ...filters, startLocation: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600">To</label>
            <div className="relative">
              <Flag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={filters.destination} onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600">Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600">Min. seats</label>
            <div className="relative">
              <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="number" min={1} value={filters.minSeats}
                onChange={(e) => setFilters({ ...filters, minSeats: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <button onClick={search}
            className="flex items-center justify-center gap-1.5 bg-accent text-white rounded-md py-2 text-sm font-medium hover:bg-[#008fad]">
            <SearchIcon className="w-3.5 h-3.5" />
            Apply filters
          </button>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : results.length === 0 ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            No trips match your filters.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((v) => <VehicleCard key={v._id} vehicle={v} actionLabel="Request / View details" />)}
          </div>
        )}
      </div>
    </div>
  );
}
`);

write('frontend/src/pages/VehicleDetails.jsx', `
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../components/Toast.jsx";

export default function VehicleDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasUnreadChat } = useNotifications() || {};
  const showToast = useToast();
  const [vehicle, setVehicle] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [seats, setSeats] = useState(1);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);

  const isOwner = vehicle && String(vehicle.postedBy?._id) === String(user?.id);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get(\`/vehicles/\${id}\`);
    setVehicle(data.data);
    if (String(data.data.postedBy?._id) === String(user?.id)) {
      const b = await api.get(\`/bookings/for-vehicle/\${id}\`);
      setBookings(b.data.data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    if (!loading && location.hash === "#request") {
      document.getElementById("request")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, location.hash]);

  const requestSeat = async () => {
    setMsg("");
    try {
      await api.post("/bookings", { vehicleId: id, seatsRequested: seats });
      setMsg("Request sent! You'll be notified once the driver confirms.");
      showToast("Seat request sent");
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not send request.");
    }
  };

  const respond = async (bookingId, status) => {
    try {
      await api.patch(\`/bookings/\${bookingId}\`, { status });
      showToast(status === "confirmed" ? "Request confirmed" : "Request rejected", status === "confirmed" ? "success" : "error");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update this request.", "error");
    }
  };

  const updateVehicleStatus = async (status) => {
    setMsg("");
    try {
      await api.patch(\`/vehicles/\${id}\`, { status });
      showToast(status === "ongoing" ? "Trip started" : "Trip marked completed");
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not update trip status.");
    }
  };

  if (loading || !vehicle) return <div className="max-w-3xl mx-auto px-4 py-10 text-slate-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-4">← Back</button>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-primary">
            {vehicle.startLocation} <span className="text-slate-400">→</span> {vehicle.destination}
          </h1>
          <StatusBadge status={vehicle.status} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-700 mb-6">
          <div><span className="text-slate-400">Vehicle:</span> {vehicle.vehicleType} {vehicle.vehicleModel && \`· \${vehicle.vehicleModel}\`}{vehicle.vehicleNumber && \` · \${vehicle.vehicleNumber}\`}</div>
          <div><span className="text-slate-400">Date/time:</span> {new Date(vehicle.travelDate).toLocaleDateString()} · {vehicle.travelTime}</div>
          <div><span className="text-slate-400">Seats:</span> {vehicle.availableSeats}/{vehicle.totalSeats} available</div>
          <div><span className="text-slate-400">Fare:</span> {vehicle.farePerSeat > 0 ? \`₹\${vehicle.farePerSeat}/seat\` : "Free"}</div>
          <div><span className="text-slate-400">Driver:</span> {vehicle.postedBy?.name}</div>
          <div><span className="text-slate-400">Contact:</span> {vehicle.postedBy?.phone || vehicle.postedBy?.email}</div>
        </div>
        {vehicle.notes && <p className="text-sm text-slate-600 mb-6 bg-slate-50 rounded-md p-3">{vehicle.notes}</p>}

        {msg && <div className="bg-accent-soft text-primary text-sm px-3 py-2 rounded-md mb-4">{msg}</div>}

        {!isOwner && vehicle.status === "available" && (
          <div id="request" className="flex items-end gap-3 scroll-mt-24">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Seats to request</label>
              <input type="number" min={1} max={vehicle.availableSeats} value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="border border-slate-300 rounded-md px-2 py-1.5 w-24 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <button onClick={requestSeat}
              className="px-4 py-2 rounded-md bg-accent text-white font-medium hover:bg-[#008fad]">
              Request / Book seat
            </button>
          </div>
        )}

        {!isOwner && vehicle.status === "ongoing" && (
          <div className="bg-accent-soft text-primary text-sm px-3 py-2 rounded-md">
            🚗 This trip is currently in progress. Use the Chat button from your Ongoing Trip page to reach the driver.
          </div>
        )}
        {!isOwner && vehicle.status === "completed" && (
          <div className="bg-slate-100 text-slate-600 text-sm px-3 py-2 rounded-md">
            This trip has been completed.
          </div>
        )}

        {isOwner && (
          <div className="mb-6 flex items-center gap-3">
            {(vehicle.status === "available" || vehicle.status === "full") && (
              <button onClick={() => updateVehicleStatus("ongoing")}
                className="px-4 py-2 rounded-md bg-accent text-white font-medium hover:bg-[#008fad]">
                🚗 Start Trip
              </button>
            )}
            {vehicle.status === "ongoing" && (
              <button onClick={() => updateVehicleStatus("completed")}
                className="px-4 py-2 rounded-md bg-slate-800 text-white font-medium hover:bg-slate-700">
                ✅ Mark Trip Completed
              </button>
            )}
            {vehicle.status === "ongoing" && (
              <span className="text-xs text-slate-500">
                Trip in progress — passengers can see this from their Ongoing Trip page.
              </span>
            )}
          </div>
        )}

        {isOwner && (
          <div>
            <h2 className="font-semibold mb-3 text-slate-700">Requests & interested passengers</h2>
            {bookings.length === 0 ? (
              <div className="text-sm text-slate-500">No requests yet.</div>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div key={b._id} className="flex items-center justify-between border border-slate-200 rounded-md p-3">
                    <div>
                      <div className="font-medium text-sm text-slate-800">{b.passenger.name}</div>
                      <div className="text-xs text-slate-400">{b.seatsRequested} seat(s) · {b.passenger.phone || b.passenger.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.status === "requested" && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" title="Needs your response" />
                      )}
                      <StatusBadge status={b.status} />
                      {(b.status === "confirmed" || b.status === "completed") && (
                        <Link to={\`/chat/\${b._id}\`}
                          className="relative text-xs px-2 py-1 rounded-md bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> Chat
                          {hasUnreadChat?.(b._id) && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                          )}
                        </Link>
                      )}
                      {b.status === "requested" && (
                        <>
                          <button onClick={() => respond(b._id, "confirmed")}
                            className="text-xs px-2 py-1 rounded-md bg-emerald-600 text-white">Confirm</button>
                          <button onClick={() => setRejectTarget(b)}
                            className="text-xs px-2 py-1 rounded-md bg-rose-600 text-white">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!rejectTarget}
        title="Reject this request?"
        message={rejectTarget ? \`\${rejectTarget.passenger.name}'s \${rejectTarget.seatsRequested} seat request will be declined.\` : ""}
        confirmLabel="Reject request"
        danger
        onCancel={() => setRejectTarget(null)}
        onConfirm={() => { respond(rejectTarget._id, "rejected"); setRejectTarget(null); }}
      />
    </div>
  );
}
`);

write('frontend/src/pages/TripsList.jsx', `
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import api from "../api/axios.js";
import Sidebar from "../components/Sidebar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../components/Toast.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";

const links = [
  { to: "/dashboard", label: "Overview" },
  { to: "/vehicles/search", label: "Search Vehicles" },
  { to: "/vehicles/post", label: "Post a Vehicle" },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip" },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

export default function TripsList({ status, title }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const { hasUnreadChat } = useNotifications() || {};
  const showToast = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/bookings/mine", { params: { status } });
    const filtered = status === "confirmed"
      ? data.data.filter((b) => !["ongoing", "completed"].includes(b.vehicle?.status))
      : data.data;
    setBookings(filtered);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const cancel = async (id) => {
    try {
      await api.patch(\`/bookings/\${id}\`, { status: "cancelled" });
      showToast("Request cancelled", "error");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not cancel this request.", "error");
    }
  };

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-primary">{title}</h1>
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            Nothing here yet.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">
                    {b.vehicle.startLocation} <span className="text-slate-400">→</span> {b.vehicle.destination}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(b.vehicle.travelDate).toLocaleDateString()} · {b.vehicle.travelTime} ·
                    {" "}Driver: {b.vehicle.postedBy?.name} · {b.seatsRequested} seat(s)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  {status === "requested" && (
                    <button onClick={() => setCancelTarget(b)}
                      className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700">
                      Cancel
                    </button>
                  )}
                  {(status === "confirmed" || status === "completed") && (
                    <Link to={\`/chat/\${b._id}\`}
                      className="relative text-xs px-2 py-1 rounded-md bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Chat
                      {hasUnreadChat?.(b._id) && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                      )}
                    </Link>
                  )}
                  {status === "completed" && (
                    <Link to={\`/feedback/\${b._id}\`}
                      className="text-xs px-2 py-1 rounded-md bg-accent text-white">Leave feedback</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!cancelTarget}
        title="Cancel this request?"
        message={cancelTarget ? \`Your request for \${cancelTarget.vehicle.startLocation} → \${cancelTarget.vehicle.destination} will be withdrawn.\` : ""}
        confirmLabel="Cancel request"
        danger
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => { cancel(cancelTarget._id); setCancelTarget(null); }}
      />
    </div>
  );
}
`);

write('frontend/src/pages/OngoingTrips.jsx', `
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const links = [
  { to: "/dashboard", label: "Overview" },
  { to: "/vehicles/search", label: "Search Vehicles" },
  { to: "/vehicles/post", label: "Post a Vehicle" },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip", end: true },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

export default function OngoingTrips() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const { hasUnreadChat } = useNotifications() || {};
  const [asDriver, setAsDriver] = useState([]);
  const [asPassenger, setAsPassenger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      setLoading(true);
      const [myVehiclesRes, myBookingsRes] = await Promise.all([
        api.get("/vehicles/mine", { params: { organization: orgId, status: "ongoing" } }),
        api.get("/bookings/mine", { params: { status: "confirmed" } }),
      ]);
      setAsDriver(myVehiclesRes.data.data);
      setAsPassenger(myBookingsRes.data.data.filter((b) => b.vehicle?.status === "ongoing"));
      setLoading(false);
    })();
  }, [orgId]);

  const nothingToShow = !loading && asDriver.length === 0 && asPassenger.length === 0;

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-1 text-primary">Ongoing trip</h1>
        <p className="text-slate-500 mb-6">Trips currently in progress — as the driver or as a passenger.</p>

        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : nothingToShow ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            No trip is currently in progress. Start a trip from a vehicle you've posted, once it's time to head out.
          </div>
        ) : (
          <div className="space-y-6">
            {asDriver.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3 text-slate-700">You're driving</h2>
                <div className="space-y-3">
                  {asDriver.map((v) => (
                    <Link key={v._id} to={\`/vehicles/\${v._id}\`}
                      className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-accent">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-800">
                          {v.startLocation} <span className="text-slate-400">→</span> {v.destination}
                        </div>
                        <StatusBadge status={v.status} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(v.travelDate).toLocaleDateString()} · {v.travelTime} ·
                        {" "}{v.availableSeats}/{v.totalSeats} seats free
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {asPassenger.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3 text-slate-700">You're riding</h2>
                <div className="space-y-3">
                  {asPassenger.map((b) => (
                    <div key={b._id} className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <Link to={\`/vehicles/\${b.vehicle._id}\`} className="font-medium text-slate-800 flex items-center gap-1.5">
                          {b.vehicle.startLocation} <span className="text-slate-400">→</span> {b.vehicle.destination}
                        </Link>
                        <StatusBadge status={b.vehicle.status} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-slate-500">
                          {new Date(b.vehicle.travelDate).toLocaleDateString()} · {b.vehicle.travelTime} ·
                          {" "}Driver: {b.vehicle.postedBy?.name} · {b.seatsRequested} seat(s)
                        </div>
                        <Link to={\`/chat/\${b._id}\`}
                          className="relative text-xs px-2 py-1 rounded-md bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> Chat
                          {hasUnreadChat?.(b._id) && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                          )}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
`);

write('frontend/src/pages/Feedback.jsx', `
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import api from "../api/axios.js";

export default function Feedback() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await api.post("/feedback", { bookingId, rating, comment });
      navigate("/trips/completed");
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit feedback.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6 text-primary">Rate your trip</h1>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)}
                className={\`w-11 h-11 rounded-md border flex items-center justify-center transition \${
                  n <= rating ? "bg-amber-400 border-amber-400 text-white" : "border-slate-300 text-slate-400"
                }\`}>
                <Star className="w-5 h-5" fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Comments</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="How was the ride?" />
        </div>
        <button disabled={loading}
          className="w-full bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60">
          {loading ? "Submitting..." : "Submit feedback"}
        </button>
      </form>
    </div>
  );
}
`);

write('frontend/src/pages/Chat.jsx', `
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Chat() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [otherParty, setOtherParty] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get(\`/messages/\${bookingId}\`);
      setMessages(data.data.messages);
      setOtherParty(data.data.otherParty);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load this chat.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => load(true), 3000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line
  }, [bookingId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const draft = text;
    setText("");
    try {
      await api.post("/messages", { bookingId, text: draft });
      load(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send message.");
      setText(draft);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col" style={{ minHeight: "calc(100vh - 4rem)" }}>
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-3 self-start">← Back</button>

      <div className="bg-white border border-slate-200 rounded-xl flex flex-col flex-1 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-800">
          Chat {otherParty?.name ? \`with \${otherParty.name}\` : ""}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50" style={{ minHeight: 320 }}>
          {loading ? (
            <div className="text-slate-500 text-sm">Loading conversation...</div>
          ) : error ? (
            <div className="text-rose-600 text-sm bg-rose-50 px-3 py-2 rounded-md">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-slate-400 text-sm text-center mt-8">
              No messages yet. Say hello and coordinate your pickup point!
            </div>
          ) : (
            messages.map((m) => {
              const mine = String(m.sender?._id) === String(user?.id);
              return (
                <div key={m._id} className={\`flex \${mine ? "justify-end" : "justify-start"}\`}>
                  <div className={\`max-w-[75%] px-3 py-2 rounded-lg text-sm \${
                    mine ? "bg-accent text-white" : "bg-white border border-slate-200 text-slate-700"
                  }\`}>
                    {!mine && <div className="text-xs font-medium text-slate-400 mb-0.5">{m.sender?.name}</div>}
                    {m.text}
                    <div className={\`text-[10px] mt-1 \${mine ? "text-white/70" : "text-slate-400"}\`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="p-3 border-t border-slate-200 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..."
            className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <button type="submit" disabled={!text.trim()}
            className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-[#008fad] disabled:opacity-50">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
`);

write('frontend/src/pages/Profile.jsx', `
import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import { useToast } from "../components/Toast.jsx";

const fileToResizedDataUrl = (file, maxSize = 300, quality = 0.8) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read image"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const showToast = useToast();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    setError("");
    setUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setAvatarPreview(dataUrl);
    } catch { setError("Could not process that image. Try a different photo."); }
    finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim()) return setError("Name cannot be empty.");
    try {
      setLoading(true);
      await updateProfile({ name, phone, avatar: avatarPreview });
      setSuccess("Profile updated.");
      showToast("Profile updated");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-primary">Your profile</h1>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-md">✓ {success}</div>}

        <div className="flex flex-col items-center gap-3">
          <Avatar user={{ name, avatar: avatarPreview }} size={88} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-60">
            {uploading ? "Processing..." : "Change photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input value={user?.email || ""} disabled
            className="w-full border border-slate-200 bg-slate-50 text-slate-400 rounded-md px-3 py-2" />
          <p className="text-xs text-slate-400 mt-1">Email can't be changed here.</p>
        </div>

        <button disabled={loading}
          className="w-full bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60">
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
`);

write('frontend/src/pages/AdminDashboard.jsx', `
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../components/Toast.jsx";

const links = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/members", label: "Membership Requests" },
  { to: "/admin/vehicles", label: "Vehicles & Trips" },
];

const StatCard = ({ label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5">
    <div className="text-3xl font-bold text-primary">{value ?? "—"}</div>
    <div className="text-sm text-slate-500 mt-1">{label}</div>
  </div>
);

export default function AdminDashboard() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    api.get(\`/admin/orgs/\${orgId}/stats\`).then((r) => setStats(r.data.data));
  }, [orgId]);

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-1 text-primary">Admin dashboard</h1>
        <p className="text-slate-500 mb-6">Monitoring {activeOrg?.org?.name}</p>
        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard label="Total users" value={stats?.totalUsers} />
          <StatCard label="Pending registrations" value={stats?.pending} />
          <StatCard label="Approved users" value={stats?.approved} />
          <StatCard label="Rejected users" value={stats?.rejected} />
          <StatCard label="Posted vehicles" value={stats?.postedVehicles} />
          <StatCard label="Ongoing pooling" value={stats?.ongoing} />
          <StatCard label="Completed pooling" value={stats?.completed} />
          <StatCard label="Current bookings" value={stats?.currentBookings} />
        </div>
      </div>
    </div>
  );
}

export function MembershipRequests() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const showToast = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await api.get(\`/orgs/\${orgId}/members\`, { params: filter ? { status: filter } : {} });
    setMembers(data.data);
    setLoading(false);
  };

  useEffect(() => { if (orgId) load(); /* eslint-disable-next-line */ }, [orgId, filter]);

  const review = async (member, decision) => {
    try {
      await api.patch(\`/orgs/\${orgId}/members/\${member._id}\`, { decision });
      showToast(decision === "approved" ? \`Approved \${member.user.name}\` : \`Rejected \${member.user.name}\`,
        decision === "approved" ? "success" : "error");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update this request.", "error");
    }
  };

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">Membership requests</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        </div>
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            No {filter || ""} requests.
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m._id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">{m.user.name}</div>
                  <div className="text-xs text-slate-500">{m.user.email} {m.user.phone && \`· \${m.user.phone}\`}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={m.status} />
                  {m.status === "pending" && (
                    <>
                      <button onClick={() => review(m, "approved")}
                        className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white">Approve</button>
                      <button onClick={() => setConfirmTarget(m)}
                        className="text-xs px-3 py-1.5 rounded-md bg-rose-600 text-white">Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmTarget}
        title="Reject this request?"
        message={confirmTarget ? \`\${confirmTarget.user.name} will be notified that their request to join was declined.\` : ""}
        confirmLabel="Reject request"
        danger
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => { review(confirmTarget, "rejected"); setConfirmTarget(null); }}
      />
    </div>
  );
}

export function AdminVehicles() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const [status, setStatus] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    api.get(\`/admin/orgs/\${orgId}/vehicles\`, { params: status ? { status } : {} })
      .then((r) => setVehicles(r.data.data))
      .finally(() => setLoading(false));
  }, [orgId, status]);

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">Vehicles & trips</h1>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="full">Full</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="p-3">Route</th><th className="p-3">Driver</th>
                  <th className="p-3">Date</th><th className="p-3">Seats</th><th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id} className="border-t border-slate-100">
                    <td className="p-3 text-slate-800">{v.startLocation} → {v.destination}</td>
                    <td className="p-3 text-slate-600">{v.postedBy?.name}</td>
                    <td className="p-3 text-slate-600">{new Date(v.travelDate).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-600">{v.availableSeats}/{v.totalSeats}</td>
                    <td className="p-3"><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">No vehicles found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
`);

write('frontend/src/pages/SuperAdminDashboard.jsx', `
import { useEffect, useState } from "react";
import { Shield, Building2, Car, CalendarCheck, Users2 } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../components/Toast.jsx";

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5">
    <div className="flex items-center gap-2 text-slate-400 mb-2">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-3xl font-bold text-primary">{value ?? "—"}</div>
  </div>
);

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("orgs");
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [suspendTarget, setSuspendTarget] = useState(null);
  const showToast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, orgsRes, usersRes] = await Promise.all([
        api.get("/admin/platform/stats"),
        api.get("/admin/platform/orgs"),
        api.get("/admin/platform/users"),
      ]);
      setStats(statsRes.data.data);
      setOrgs(orgsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not load platform data.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const setOrgActive = async (org, isActive) => {
    setMsg("");
    try {
      await api.patch(\`/admin/platform/orgs/\${org._id}\`, { isActive });
      showToast(isActive ? \`\${org.name} reactivated\` : \`\${org.name} suspended\`, isActive ? "success" : "error");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update organization.", "error");
    }
  };

  const changeRole = async (u, platformRole) => {
    setMsg("");
    try {
      await api.patch(\`/admin/platform/users/\${u._id}\`, { platformRole });
      showToast(\`\${u.name} is now \${platformRole === "super_admin" ? "a super admin" : "a regular user"}\`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update role.", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-primary">Super Admin · Platform Overview</h1>
      </div>
      <p className="text-slate-500 mb-6">Monitor every pooling community across the platform.</p>

      {msg && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md mb-4">⚠ {msg}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Organizations" value={stats?.organizations} />
        <StatCard icon={Car} label="Vehicles posted" value={stats?.vehicles} />
        <StatCard icon={CalendarCheck} label="Bookings" value={stats?.bookings} />
        <StatCard icon={Users2} label="Memberships" value={stats?.memberships} />
      </div>

      <div className="flex gap-2 mb-4 border-b border-slate-200">
        {[{ id: "orgs", label: "Organizations" }, { id: "users", label: "All Users" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={\`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors \${
              tab === t.id ? "border-accent text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }\`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-500">Loading...</div>
      ) : tab === "orgs" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Organization</th>
                  <th className="text-left px-4 py-3 font-semibold">Created by</th>
                  <th className="text-left px-4 py-3 font-semibold">Members</th>
                  <th className="text-left px-4 py-3 font-semibold">Vehicles</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{o.name}</div>
                      <div className="text-xs text-slate-400">{o.location}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {o.createdBy?.name}
                      <div className="text-xs text-slate-400">{o.createdBy?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{o.userCount}</td>
                    <td className="px-4 py-3 text-slate-700">{o.vehicleCount}</td>
                    <td className="px-4 py-3">
                      <span className={\`text-xs font-bold px-2 py-1 rounded-full \${
                        o.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }\`}>
                        {o.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => (o.isActive ? setSuspendTarget(o) : setOrgActive(o, true))}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50">
                        {o.isActive ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {orgs.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-slate-400">No organizations yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Platform role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select value={u.platformRole} onChange={(e) => changeRole(u, e.target.value)}
                        disabled={u._id === user?.id}
                        className="text-xs border border-slate-200 rounded-full px-3 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50">
                        <option value="user">User</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-10 text-slate-400">No users yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!suspendTarget}
        title="Suspend this organization?"
        message={suspendTarget ? \`Members of "\${suspendTarget.name}" will no longer be able to use pooling features until it's reactivated.\` : ""}
        confirmLabel="Suspend organization"
        danger
        onCancel={() => setSuspendTarget(null)}
        onConfirm={() => { setOrgActive(suspendTarget, false); setSuspendTarget(null); }}
      />
    </div>
  );
}
`);

write('frontend/src/pages/Notifications.jsx', `
import { Link } from "react-router-dom";
import { Bell, UserPlus, MessageCircle, UserCheck } from "lucide-react";
import { useNotifications } from "../context/NotificationsContext.jsx";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return \`\${m}m ago\`;
  const h = Math.floor(m / 60);
  if (h < 24) return \`\${h}h ago\`;
  return \`\${Math.floor(h / 24)}d ago\`;
}

export default function Notifications() {
  const { pendingRequests, pendingJoinRequests, unreadChats, totalCount, refresh } = useNotifications() || {};

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-bold text-primary">Notifications</h1>
        </div>
        <button onClick={refresh} className="text-xs text-slate-400 hover:text-slate-600">Refresh</button>
      </div>
      <p className="text-slate-500 mb-6">
        {totalCount > 0 ? \`\${totalCount} item\${totalCount > 1 ? "s" : ""} need your attention\` : "You're all caught up"}
      </p>

      {(!pendingRequests?.length && !pendingJoinRequests?.length && !unreadChats?.length) ? (
        <div className="text-slate-400 bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
          Nothing new right now.
        </div>
      ) : (
        <div className="space-y-6">
          {pendingJoinRequests?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Membership requests</h2>
              <div className="space-y-2">
                {pendingJoinRequests.map((r) => (
                  <Link key={r.membershipId} to="/admin/members"
                    className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-accent">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">{r.userName} wants to join</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.organizationName}</div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(r.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {pendingRequests?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Seat requests</h2>
              <div className="space-y-2">
                {pendingRequests.map((r) => (
                  <Link key={r.bookingId} to={\`/vehicles/\${r.vehicleId}\`}
                    className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-accent">
                    <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">{r.passengerName} wants a seat</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.route}</div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(r.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {unreadChats?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Unread messages</h2>
              <div className="space-y-2">
                {unreadChats.map((c) => (
                  <Link key={c.bookingId} to={\`/chat/\${c.bookingId}\`}
                    className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-accent">
                    <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">
                        {c.otherPartyLabel} · {c.unreadCount} new message{c.unreadCount > 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.route}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`);

write('README.md', `
# Velocity Pool · Vehicle Pooling Platform

Full-stack multi-tenant carpooling platform.

- **Backend:** Node.js, Express, MongoDB, JWT auth
- **Frontend:** React (Vite) + Tailwind CSS

## Architecture

- **Organizations** = independent pooling servers. All data is scoped by organization.
- **Roles:**
  - \`platformRole: super_admin\` — platform-wide oversight
  - \`Membership.role: org_admin | member\` — per-organization role
  - Joining always starts as \`pending\` until an org admin approves
- **Chat:** each confirmed booking gets its own private thread (polling, 3s refresh)
- **Notifications:** bell in navbar polls every 15s and shows pending seat requests, membership requests, and unread messages
- **Auto-completion:** background job every 5 min marks expired trips completed

## Setup

### Backend
\`\`\`
cd backend
cp .env.example .env      # edit MONGODB_URI and JWT_SECRET
npm install
npm run seed              # optional demo data
npm run dev               # http://localhost:5000

# or to create just a superadmin from .env:
npm run seed:superadmin
\`\`\`

### Frontend
\`\`\`
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:3000
\`\`\`

## Demo credentials (after \`npm run seed\`)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | super@velocity.com | super123 |
| Org Admin | admin@greenride.com | admin123 |
| Org Admin 2 | admin@metropool.com | admin123 |
| Normal User | user@greenride.com | user123 |

## Reset to a clean slate (superadmin only)
\`\`\`
cd backend
npm run reset
\`\`\`
`);

console.log('✅ carpool-platform generated successfully!\n');
console.log('Next steps:\n');
console.log('  1. Backend:');
console.log('     cd carpool-platform/backend');
console.log('     cp .env.example .env    # then edit MONGODB_URI if not using local Mongo');
console.log('     npm install');
console.log('     npm run seed            # optional');
console.log('     npm run dev');
console.log('');
console.log('  2. Frontend (new terminal):');
console.log('     cd carpool-platform/frontend');
console.log('     cp .env.example .env');
console.log('     npm install');
console.log('     npm run dev');
console.log('');
console.log('Open http://localhost:3000\n');