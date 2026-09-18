import mongoose from "mongoose";

// Each Organization is an independent "pooling server/community".
// All child data (memberships, vehicles, bookings, feedback) is scoped
// by organization: <field> so orgs never see each other's data.
const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: ["residency", "it_park", "corporate", "college", "other"],
      default: "other",
    },
    size: {
      type: String,
      enum: ["small", "medium", "large", "enterprise"],
      default: "medium",
    },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

organizationSchema.index({ name: "text", location: "text" });

export default mongoose.model("Organization", organizationSchema);
