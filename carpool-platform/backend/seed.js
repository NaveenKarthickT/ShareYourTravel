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

  // Wipe everything first
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Membership.deleteMany({});
  await Vehicle.deleteMany({});
  console.log("Cleared existing data\n");

  // ---- 1. Superadmin ----
  await User.create({
    name: "Site Owner",
    email: "super@velocity.com",
    password: "super123",
    platformRole: "super_admin",
  });
  console.log("✓ Superadmin created");

  // ---- 2. Org 1: Green Ride Co ----
  const admin1 = await User.create({
    name: "Alex Rivera",
    email: "admin@greenride.com",
    password: "admin123",
    phone: "+91 90000 11111",
  });

  const org1 = await Organization.create({
    name: "Green Ride Co",
    slug: "green-ride-co",
    type: "corporate",
    size: "medium",
    description: "Eco-friendly carpool community",
    location: "Bangalore",
    createdBy: admin1._id,        // ← required
  });

  await Membership.create({
    user: admin1._id,
    organization: org1._id,
    role: "org_admin",
    status: "approved",
    reviewedBy: admin1._id,
    reviewedAt: new Date(),
  });

  const user1 = await User.create({
    name: "Jamie Lee",
    email: "user@greenride.com",
    password: "user123",
    phone: "+91 90000 22222",
  });
  await Membership.create({
    user: user1._id,
    organization: org1._id,
    role: "member",
    status: "approved",
    reviewedBy: admin1._id,
    reviewedAt: new Date(),
  });
  console.log("✓ Green Ride Co created with 2 members");

  // ---- 3. Org 2: Metro Poolers ----
  const admin2 = await User.create({
    name: "Priya Shah",
    email: "admin@metropool.com",
    password: "admin123",
  });

  const org2 = await Organization.create({
    name: "Metro Poolers",
    slug: "metro-poolers",
    type: "residency",
    size: "large",
    description: "City commuter pooling",
    location: "Mumbai",
    createdBy: admin2._id,
  });

  await Membership.create({
    user: admin2._id,
    organization: org2._id,
    role: "org_admin",
    status: "approved",
    reviewedBy: admin2._id,
    reviewedAt: new Date(),
  });
  console.log("✓ Metro Poolers created with 1 admin");

  // ---- 4. Demo vehicles ----
  const tomorrow = new Date(Date.now() + 86400000);
  const dayAfter = new Date(Date.now() + 2 * 86400000);

  await Vehicle.insertMany([
    {
      organization: org1._id,
      postedBy: admin1._id,
      vehicleType: "car",
      vehicleModel: "Toyota Camry",
      vehicleNumber: "CA 1234",
      startLocation: "Downtown",
      destination: "Airport",
      travelDate: tomorrow,
      travelTime: "08:30",
      totalSeats: 5,
      availableSeats: 4,
      farePerSeat: 12,
      status: "available",
    },
    {
      organization: org1._id,
      postedBy: admin1._id,
      vehicleType: "van",
      vehicleModel: "Ford Transit",
      vehicleNumber: "TX 9012",
      startLocation: "Uptown",
      destination: "Tech Park",
      travelDate: dayAfter,
      travelTime: "07:00",
      totalSeats: 8,
      availableSeats: 6,
      farePerSeat: 8,
      status: "available",
    },
    {
      organization: org1._id,
      postedBy: admin1._id,
      vehicleType: "car",
      vehicleModel: "Honda City",
      vehicleNumber: "KA 05 XY 7890",
      startLocation: "Whitefield",
      destination: "Electronic City",
      travelDate: tomorrow,
      travelTime: "09:15",
      totalSeats: 4,
      availableSeats: 3,
      farePerSeat: 0,
      status: "available",
    },
    {
      organization: org2._id,
      postedBy: admin2._id,
      vehicleType: "other",
      vehicleModel: "Honda CR-V",
      vehicleNumber: "NY 5678",
      startLocation: "North Side",
      destination: "City Center",
      travelDate: tomorrow,
      travelTime: "09:00",
      totalSeats: 5,
      availableSeats: 3,
      farePerSeat: 10,
      status: "available",
    },
  ]);
  console.log("✓ 4 demo vehicles created");

  console.log("\n✅ Seed complete!\n");
  console.log("Login credentials:");
  console.log("──────────────────────────────────────────────────────");
  console.log("  Superadmin:  super@velocity.com  /  super123");
  console.log("  Org Admin 1: admin@greenride.com /  admin123");
  console.log("  Org Admin 2: admin@metropool.com /  admin123");
  console.log("  Normal user: user@greenride.com  /  user123");
  console.log("──────────────────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});