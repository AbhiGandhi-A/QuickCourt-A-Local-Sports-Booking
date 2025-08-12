import mongoose from "mongoose"

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["venue", "user"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    details: { type: String, default: "" },
    status: { type: String, enum: ["open", "resolved", "dismissed"], default: "open" }
  },
  { timestamps: true }
)

export const Report = mongoose.model("Report", reportSchema)