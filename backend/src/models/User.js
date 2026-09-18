import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Global platform-level user. Role here is the PLATFORM role.
// Org-specific role/status lives in Membership.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    // Stored as a data: URI (frontend resizes/compresses to a small JPEG
    // before upload) — no external file storage provider is wired up yet.
    avatar: { type: String, default: "" },
    platformRole: {
      type: String,
      enum: ["super_admin", "user"],
      default: "user",
      // "org_admin" is NOT a platform role — org admin-ship is per-organization,
      // tracked via Membership.role, so one person can be a normal user in one
      // org and an admin in another.
    },
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
