import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // passenger
    aboutUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // driver/post owner
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

feedbackSchema.index({ booking: 1, fromUser: 1 }, { unique: true });

export default mongoose.model("Feedback", feedbackSchema);
