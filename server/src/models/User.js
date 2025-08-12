import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
    role: { type: String, enum: ["user", "facility", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    status: { type: String, enum: ["active", "banned"], default: "active" }
  },
  { timestamps: true }
)

export const User = mongoose.model("User", userSchema)