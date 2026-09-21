import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();
  const email = (process.env.SUPERADMIN_EMAIL || "naveenkarthickt@gmail.com").toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || "naveen@123";
  const name = process.env.SUPERADMIN_NAME || "Naveen Karthick";

  let user = await User.findOne({ email });
  if (user) {
    user.platformRole = "super_admin";
    await user.save();
    console.log(`Existing user ${email} upgraded to super_admin`);
  } else {
    user = await User.create({ name, email, password, platformRole: "super_admin" });
    console.log(`Super admin created: ${email}`);
  }
  await mongoose.disconnect();
  process.exit(0);
};
run();
