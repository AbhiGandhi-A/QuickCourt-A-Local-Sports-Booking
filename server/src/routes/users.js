import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { authRequired } from "../middleware/auth.js"
import { User } from "../models/User.js"

const router = express.Router()

const avatarDir = path.join(process.cwd(), "uploads", "avatars")
fs.mkdirSync(avatarDir, { recursive: true })
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    const safe = file.originalname.replace(/\s+/g, "-").toLowerCase()
    cb(null, Date.now() + "-" + safe.replace(ext, "") + ext)
  }
})
const upload = multer({ storage })

router.get("/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).lean()
  if (!user) return res.status(404).json({ error: "Not found" })
  res.json({
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role
    }
  })
})

router.put("/me", authRequired, upload.single("avatar"), async (req, res) => {
  const { fullName } = req.body
  const update = {}
  if (fullName) update.fullName = fullName
  if (req.file) update.avatarUrl = `/uploads/avatars/${req.file.filename}`
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).lean()
  res.json({
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role
    }
  })
})

export default router