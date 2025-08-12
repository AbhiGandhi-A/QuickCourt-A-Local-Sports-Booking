import mongoose from "mongoose"

const operatingHoursSchema = new mongoose.Schema(
  {
    open: { type: String, default: "06:00" }, // HH:mm
    close: { type: String, default: "23:00" } // HH:mm
  },
  { _id: false }
)

const courtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sportType: { type: String, enum: ["badminton", "football", "tennis", "table-tennis"], required: true },
  pricePerHour: { type: Number, required: true },
  operatingHours: { type: operatingHoursSchema, default: () => ({}) }
})

const venueSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    name: { type: String, required: true, index: "text" },
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    locationShort: { type: String, default: "" },
    venueType: { type: String, enum: ["indoor", "outdoor", "mixed"], default: "mixed" },
    sports: [{ type: String, enum: ["badminton", "football", "tennis", "table-tennis"] }],
    amenities: [{ type: String }],
    photos: [{ type: String }],
    ratingAverage: { type: Number, default: 0 },
    // legacy boolean (still used on public listing)
    approved: { type: Boolean, default: false },
    // admin workflow
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    approvalComment: { type: String, default: "" },
    courts: [courtSchema]
  },
  { timestamps: true }
)

venueSchema.index({ name: "text", city: "text", description: "text" })

export const Venue = mongoose.model("Venue", venueSchema)