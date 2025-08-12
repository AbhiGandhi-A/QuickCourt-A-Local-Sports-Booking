import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import dayjs from "dayjs"
import { authRequired } from "../middleware/auth.js"
import { requireRole } from "../middleware/role.js"
import { Venue } from "../models/Venue.js"
import { Booking } from "../models/Booking.js"
import { Block } from "../models/Block.js"
import mongoose from "mongoose"

const router = express.Router()

const venuePhotosDir = path.join(process.cwd(), "uploads", "venues")
fs.mkdirSync(venuePhotosDir, { recursive: true })
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, venuePhotosDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    const safe = file.originalname.replace(/\s+/g, "-").toLowerCase()
    cb(null, Date.now() + "-" + safe.replace(ext, "") + ext)
  }
})
const upload = multer({ storage })

async function getOwnedVenue(ownerId, venueId) {
  const v = await Venue.findOne({ _id: venueId, ownerId }).lean()
  return v
}

router.get("/venues/my", authRequired, requireRole("facility"), async (req, res) => {
  const venues = await Venue.find({ ownerId: req.user.id }).sort({ createdAt: -1 }).lean()
  res.json({ data: venues.map(v => ({ ...v, id: v._id })) })
})

router.post("/venues", authRequired, requireRole("facility"), upload.array("photos", 10), async (req, res) => {
  const { name, description, address, city, locationShort, venueType, sports, amenities } = req.body
  if (!name) return res.status(400).json({ error: "Name required" })
  const sportsArr = (sports ? (Array.isArray(sports) ? sports : String(sports).split(",").map(s => s.trim())) : [])
    .filter(s => !!s)
  const amenitiesArr = (amenities ? (Array.isArray(amenities) ? amenities : String(amenities).split(",").map(a => a.trim())) : [])
    .filter(a => !!a)
  const photos = (req.files || []).map(f => `/uploads/venues/${f.filename}`)
  const v = await Venue.create({
    ownerId: req.user.id,
    name,
    description,
    address,
    city,
    locationShort,
    venueType: ["indoor", "outdoor", "mixed"].includes(venueType) ? venueType : "mixed",
    sports: sportsArr,
    amenities: amenitiesArr,
    photos,
    approved: true
  })
  res.json({ id: v._id })
})

router.put("/venues/:venueId", authRequired, requireRole("facility"), upload.array("photos", 10), async (req, res) => {
  const v = await Venue.findOne({ _id: req.params.venueId, ownerId: req.user.id })
  if (!v) return res.status(404).json({ error: "Not found" })
  const { name, description, address, city, locationShort, venueType, sports, amenities } = req.body
  if (name !== undefined) v.name = name
  if (description !== undefined) v.description = description
  if (address !== undefined) v.address = address
  if (city !== undefined) v.city = city
  if (locationShort !== undefined) v.locationShort = locationShort
  if (venueType !== undefined && ["indoor", "outdoor", "mixed"].includes(venueType)) v.venueType = venueType
  if (sports !== undefined) v.sports = (Array.isArray(sports) ? sports : String(sports).split(",").map(s => s.trim())).filter(Boolean)
  if (amenities !== undefined) v.amenities = (Array.isArray(amenities) ? amenities : String(amenities).split(",").map(a => a.trim())).filter(Boolean)
  const photos = (req.files || []).map(f => `/uploads/venues/${f.filename}`)
  if (photos.length) v.photos = [...v.photos, ...photos]
  await v.save()
  res.json({ message: "Updated" })
})

router.delete("/venues/:venueId/photos", authRequired, requireRole("facility"), async (req, res) => {
  const { photoUrl } = req.body
  const v = await Venue.findOne({ _id: req.params.venueId, ownerId: req.user.id })
  if (!v) return res.status(404).json({ error: "Not found" })
  v.photos = v.photos.filter(p => p !== photoUrl)
  await v.save()
  res.json({ message: "Photo removed" })
})


router.post("/venues/:venueId/courts", authRequired, requireRole("facility"), async (req, res) => {
  const { name, sportType, pricePerHour, open = "06:00", close = "23:00" } = req.body
  const v = await Venue.findOne({ _id: req.params.venueId, ownerId: req.user.id })
  if (!v) return res.status(404).json({ error: "Not found" })
  if (!name || !sportType || !pricePerHour) return res.status(400).json({ error: "Missing fields" })
  v.courts.push({
    name,
    sportType,
    pricePerHour: Number(pricePerHour),
    operatingHours: { open, close }
  })
  await v.save()
  res.json({ message: "Court added", courtId: v.courts[v.courts.length - 1]._id })
})

router.put("/venues/:venueId/courts/:courtId", authRequired, requireRole("facility"), async (req, res) => {
  const { name, sportType, pricePerHour, open, close } = req.body
  const v = await Venue.findOne({ _id: req.params.venueId, ownerId: req.user.id })
  if (!v) return res.status(404).json({ error: "Not found" })
  const c = v.courts.id(req.params.courtId)
  if (!c) return res.status(404).json({ error: "Court not found" })
  if (name !== undefined) c.name = name
  if (sportType !== undefined) c.sportType = sportType
  if (pricePerHour !== undefined) c.pricePerHour = Number(pricePerHour)
  if (open !== undefined) c.operatingHours.open = open
  if (close !== undefined) c.operatingHours.close = close
  await v.save()
  res.json({ message: "Court updated" })
})

router.delete("/venues/:venueId/courts/:courtId", authRequired, requireRole("facility"), async (req, res) => {
  const v = await Venue.findOne({ _id: req.params.venueId, ownerId: req.user.id })
  if (!v) return res.status(404).json({ error: "Not found" })
  const c = v.courts.id(req.params.courtId)
  if (!c) return res.status(404).json({ error: "Court not found" })
  c.deleteOne()
  await v.save()
  res.json({ message: "Court deleted" })
})

router.get("/venues/:venueId/courts/:courtId/blocks", authRequired, requireRole("facility"), async (req, res) => {
  const { venueId, courtId } = req.params
  const owned = await getOwnedVenue(req.user.id, venueId)
  if (!owned) return res.status(404).json({ error: "Not found" })
  const blocks = await Block.find({ ownerId: req.user.id, venueId, courtId }).sort({ date: 1, startTime: 1 }).lean()
  res.json({ data: blocks.map(b => ({ ...b, id: b._id })) })
})

router.post("/venues/:venueId/courts/:courtId/blocks", authRequired, requireRole("facility"), async (req, res) => {
  const { venueId, courtId } = req.params
  const { date, startTime, endTime, reason } = req.body
  const owned = await getOwnedVenue(req.user.id, venueId)
  if (!owned) return res.status(404).json({ error: "Not found" })
  if (!date || !startTime || !endTime) return res.status(400).json({ error: "Missing fields" })
  const block = await Block.create({
    ownerId: req.user.id, venueId, courtId, date, startTime, endTime, reason: reason || "Maintenance"
  })
  res.json({ id: block._id })
})

router.delete("/blocks/:blockId", authRequired, requireRole("facility"), async (req, res) => {
  const b = await Block.findOne({ _id: req.params.blockId, ownerId: req.user.id })
  if (!b) return res.status(404).json({ error: "Not found" })
  await b.deleteOne()
  res.json({ message: "Block removed" })
})

router.get("/bookings", authRequired, requireRole("facility"), async (req, res) => {
  const ownerId = req.user.id
  const venues = await Venue.find({ ownerId }).select("_id name courts").lean()
  const venueIds = venues.map(v => v._id)
  const { status } = req.query
  const filter = { venueId: { $in: venueIds } }
  if (status) filter.status = status
  const bookings = await Booking.find(filter).sort({ date: 1, startTime: 1 }).lean()


  const userIds = [...new Set(bookings.map(b => String(b.userId)))].map(id => new mongoose.Types.ObjectId(id))
  let usersMap = new Map()
  if (userIds.length) {
    const usersAgg = await mongoose.connection.collection("users").find({ _id: { $in: userIds } }).toArray()
    usersMap = new Map(usersAgg.map(u => [String(u._id), u]))
  }

  const venueMap = new Map(venues.map(v => [String(v._id), v]))
  const data = bookings.map(b => {
    const v = venueMap.get(String(b.venueId))
    const court = v?.courts?.find(c => String(c._id) === String(b.courtId))
    const u = usersMap.get(String(b.userId))
    return {
      id: b._id,
      userName: u?.fullName || "User",
      venueName: v?.name,
      courtName: court?.name,
      sportType: b.sportType,
      date: b.date,
      time: `${b.startTime} - ${b.endTime}`,
      status: b.status,
      priceTotal: b.priceTotal
    }
  })
  res.json({ data })
})

router.patch("/bookings/:bookingId/complete", authRequired, requireRole("facility"), async (req, res) => {
  const ownerId = req.user.id
  const booking = await Booking.findById(req.params.bookingId)
  if (!booking) return res.status(404).json({ error: "Not found" })
  const venue = await Venue.findOne({ _id: booking.venueId, ownerId })
  if (!venue) return res.status(403).json({ error: "Forbidden" })
  booking.status = "completed"
  await booking.save()
  res.json({ message: "Marked completed" })
})


router.get("/stats/kpis", authRequired, requireRole("facility"), async (req, res) => {
  const ownerId = req.user.id
  const venues = await Venue.find({ ownerId }).select("_id courts").lean()
  const venueIds = venues.map(v => v._id)
  const totalBookings = await Booking.countDocuments({ venueId: { $in: venueIds }, status: { $ne: "cancelled" } })
  const activeCourts = venues.reduce((acc, v) => acc + (v.courts?.length || 0), 0)
  const agg = await Booking.aggregate([
    { $match: { venueId: { $in: venueIds }, status: { $ne: "cancelled" } } },
    { $group: { _id: null, revenue: { $sum: "$priceTotal" } } }
  ])
  const earnings = agg[0]?.revenue || 0
  res.json({ totalBookings, activeCourts, earnings })
})

router.get("/stats/trends", authRequired, requireRole("facility"), async (req, res) => {
  const { period = "daily", limit = 14 } = req.query
  const ownerId = req.user.id
  const venues = await Venue.find({ ownerId }).select("_id").lean()
  const venueIds = venues.map(v => v._id)
  let groupId
  if (period === "weekly") groupId = { $isoWeek: { $toDate: { $concat: ["$date", "T", "$startTime", ":00Z"] } } }
  else if (period === "monthly") groupId = { $month: { $toDate: { $concat: ["$date", "T", "$startTime", ":00Z"] } } }
  else groupId = "$date"
  const data = await Booking.aggregate([
    { $match: { venueId: { $in: venueIds }, status: { $ne: "cancelled" } } },
    { $group: { _id: groupId, count: { $sum: 1 }, revenue: { $sum: "$priceTotal" } } },
    { $sort: { _id: 1 } },
    { $limit: Number(limit) }
  ])
  res.json({ data })
})

router.get("/stats/earnings", authRequired, requireRole("facility"), async (req, res) => {
  const ownerId = req.user.id
  const venues = await Venue.find({ ownerId }).select("_id name").lean()
  const venueIds = venues.map(v => v._id)
  const data = await Booking.aggregate([
    { $match: { venueId: { $in: venueIds }, status: { $ne: "cancelled" } } },
    { $group: { _id: "$venueId", revenue: { $sum: "$priceTotal" } } },
    { $sort: { revenue: -1 } }
  ])
  const labels = data.map(d => String(venues.find(v => String(v._id) === String(d._id))?.name || "Venue"))
  const values = data.map(d => d.revenue)
  res.json({ labels, values })
})

router.get("/stats/peak-hours", authRequired, requireRole("facility"), async (req, res) => {
  const ownerId = req.user.id
  const venues = await Venue.find({ ownerId }).select("_id").lean()
  const venueIds = venues.map(v => v._id)
  const data = await Booking.aggregate([
    { $match: { venueId: { $in: venueIds }, status: { $ne: "cancelled" } } },
    { $project: { hour: { $toInt: { $substr: ["$startTime", 0, 2] } } } },
    { $group: { _id: "$hour", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ])
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const values = hours.map(h => data.find(d => d._id === h)?.count || 0)
  res.json({ hours, values })
})

router.get("/stats/calendar", authRequired, requireRole("facility"), async (req, res) => {
  const ownerId = req.user.id
  const { year, month } = req.query
  const y = Number(year) || dayjs().year()
  const m = Number(month) || dayjs().month() + 1 // 1-12
  const start = dayjs(`${y}-${String(m).padStart(2, "0")}-01`)
  const end = start.endOf("month")
  const venues = await Venue.find({ ownerId }).select("_id").lean()
  const venueIds = venues.map(v => v._id)
  const data = await Booking.aggregate([
    { $match: { venueId: { $in: venueIds }, status: { $ne: "cancelled" }, date: { $gte: start.format("YYYY-MM-DD"), $lte: end.format("YYYY-MM-DD") } } },
    { $group: { _id: "$date", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ])
  res.json({ data })
})

export default router