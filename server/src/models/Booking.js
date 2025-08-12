import mongoose from "mongoose"

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    courtId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sportType: { type: String, enum: ["badminton", "football", "tennis", "table-tennis"], required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    startTime: { type: String, required: true }, // Format: "HH:mm"
    endTime: { type: String, required: true },   // Format: "HH:mm"
    priceTotal: { type: Number, required: true },
    status: { type: String, enum: ["confirmed", "cancelled", "completed"], default: "confirmed" },
    paymentStatus: { type: String, enum: ["paid", "unpaid"], default: "paid" }
  },
  { timestamps: true }
)

// Unique index to prevent double booking for same venue, court, date, time slot
bookingSchema.index(
  { venueId: 1, courtId: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true }
)

export const Booking = mongoose.model("Booking", bookingSchema)
