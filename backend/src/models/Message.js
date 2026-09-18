import mongoose from "mongoose";

// Chat is scoped to a single Booking (one passenger <-> one vehicle owner).
// This automatically gives each passenger their own independent, private
// thread with the driver — even when a vehicle has multiple confirmed
// passengers, since each has a distinct Booking document.
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
