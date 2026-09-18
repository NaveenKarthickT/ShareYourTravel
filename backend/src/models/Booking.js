import mongoose from "mongoose";

// A request/booking by a passenger for a specific vehicle/trip.
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
