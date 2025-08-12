import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null = global
  message: { type: String, required: true },
  type: { type: String, enum: ["alert", "warning", "info"], default: "alert" },
  priority: { type: String, enum: ["normal", "high"], default: "normal" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model("Notification", notificationSchema);
