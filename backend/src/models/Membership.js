import mongoose from "mongoose";

// Links a User to an Organization with an org-scoped role and approval status.
// This is what makes "join an org requires admin approval" and
// "one user, many orgs, different roles" possible.
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
