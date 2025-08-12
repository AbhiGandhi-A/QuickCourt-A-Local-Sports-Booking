import React from "react"
import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import multer from "multer"
import path from "path"
import fs from "fs"
import { OAuth2Client } from "google-auth-library"
import { User } from "../models/User.js"
import { generateOTP } from "../utils/otp.js"
import { sendOTPEmail } from "../lib/mailer.js"

const router = express.Router()

const avatarDir = path.join(process.cwd(), "uploads", "avatars")
fs.mkdirSync(avatarDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const safe = file.originalname.replace(/\s+/g, "-").toLowerCase()
    cb(null, Date.now() + "-" + safe.replace(ext, "") + ext)
  },
})

const upload = multer({ storage })

router.post("/signup", upload.single("avatar"), async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body
    if (!email || !password || !fullName) return res.status(400).json({ error: "Missing fields" })

    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: "Email already registered" })

    const passwordHash = await bcrypt.hash(password, 10)
    const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : ""
    const { code, expiresAt } = generateOTP()

    const user = await User.create({
      email,
      passwordHash,
      fullName,
      avatarUrl,
      role: role && ["user", "facility", "admin"].includes(role) ? role : "user",
      isVerified: false,
      otpCode: code,
      otpExpiresAt: expiresAt,
      status: "active",
    })

    // Send OTP by email (fallback logs in dev if SMTP not set)
    try {
      const sent = await sendOTPEmail(user.email, code)
      if (!sent.sent) {
        console.log(`[DEV] OTP for ${email}: ${code} (expires in ${process.env.OTP_EXP_MINUTES || 10} min)`)
      }
    } catch (e) {
      console.warn("Failed to send OTP email:", e.message)
      console.log(`[DEV] OTP for ${email}: ${code} (expires in ${process.env.OTP_EXP_MINUTES || 10} min)`)
    }

    res.json({ message: "Signup successful. Please check your email for OTP.", email: user.email })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ error: "User not found" })
    if (user.isVerified) return res.json({ message: "Already verified" })

    if (!user.otpCode || !user.otpExpiresAt) return res.status(400).json({ error: "No OTP pending" })
    if (user.otpCode !== otp) return res.status(400).json({ error: "Invalid OTP" })
    if (new Date(user.otpExpiresAt).getTime() < Date.now()) return res.status(400).json({ error: "OTP expired" })

    user.isVerified = true
    user.otpCode = null
    user.otpExpiresAt = null
    await user.save()

    res.json({ message: "Account verified. You can now login." })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: "Invalid credentials" })
    if (!user.isVerified) return res.status(403).json({ error: "Please verify OTP first" })
    if (user.status === "banned") return res.status(403).json({ error: "Account banned" })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: "Invalid credentials" })

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" })
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
      },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

router.post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) return res.status(400).json({ error: "Google credential required" })

    // Verify Google JWT token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const { email, name, picture, sub: googleId } = payload

    // Check if user exists
    let user = await User.findOne({ email })

    if (!user) {
      // Create new user with Google data
      user = await User.create({
        email,
        fullName: name,
        avatarUrl: picture,
        googleId,
        isVerified: true, // Google accounts are pre-verified
        role: "user",
        status: "active",
      })
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId
      if (!user.avatarUrl && picture) user.avatarUrl = picture
      await user.save()
    }

    if (user.status === "banned") {
      return res.status(403).json({ error: "Account banned" })
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" })
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
      },
    })
  } catch (e) {
    console.error("Google login error:", e)
    res.status(500).json({ error: "Google authentication failed" })
  }
})

router.post("/logout", (req, res) => {
  res.clearCookie("token")
  res.json({ message: "Logged out" })
})

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token
    if (!token) return res.json({ user: null })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.id).lean()
    if (!user) return res.json({ user: null })

    res.json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
      },
    })
  } catch (e) {
    return res.json({ user: null })
  }
})

export default router
