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
  console.log("Connected to MongoDB\n");
  const results = await Promise.all([
    User.deleteMany({}), Organization.deleteMany({}), Membership.deleteMany({}),
    Vehicle.deleteMany({}), Booking.deleteMany({}), Message.deleteMany({}), Feedback.deleteMany({}),
  ]);
  const labels = ["Users","Organizations","Memberships","Vehicles","Bookings","Messages","Feedback"];
  console.log("🗑️  Deleted:");
  results.forEach((r, i) => console.log(`   ${labels[i]}: ${r.deletedCount}`));

  await User.create({
    name: "Site Owner", email: "super@velocity.com",
    password: "super123", platformRole: "super_admin",
  });
  console.log("\n✅ Fresh superadmin created: super@velocity.com / super123\n");
  await mongoose.disconnect();
  process.exit(0);
};
run().catch((e) => { console.error("❌", e.message); process.exit(1); });
