import mongoose from "mongoose"

const blockSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    courtId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },   // HH:mm
    reason: { type: String, default: "Maintenance" }
  },
  { timestamps: true }
)

blockSchema.index({ venueId: 1, courtId: 1, date: 1, startTime: 1, endTime: 1 })

export const Block = mongoose.model("Block", blockSchema)