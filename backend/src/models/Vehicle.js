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
