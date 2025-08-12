import express from "express"
import { Venue } from "../models/Venue.js"
import { Booking } from "../models/Booking.js"
import { Block } from "../models/Block.js"

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const {
      page = 1, limit = 8,
      q = "",
      sportType,
      minPrice,
      maxPrice,
      venueType,
      minRating
    } = req.query

    const filter = { approved: true, approvalStatus: "approved" }
    if (q) {
      filter.$text = { $search: q }
    }
    if (sportType) filter.sports = sportType
    if (venueType) filter.venueType = venueType
    if (minRating) filter.ratingAverage = { $gte: Number(minRating) }

    if (minPrice || maxPrice) {
      filter.courts = {}
      filter.courts.$elemMatch = {}
      if (minPrice) filter.courts.$elemMatch.pricePerHour = { ...(filter.courts.$elemMatch.pricePerHour || {}), $gte: Number(minPrice) }
      if (maxPrice) filter.courts.$elemMatch.pricePerHour = { ...(filter.courts.$elemMatch.pricePerHour || {}), $lte: Number(maxPrice) }
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [items, total] = await Promise.all([
      Venue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Venue.countDocuments(filter)
    ])

    const data = items.map(v => {
      const startingPrice = v.courts?.length ? Math.min(...v.courts.map(c => c.pricePerHour)) : 0
      return {
        id: v._id,
        name: v.name,
        sports: v.sports,
        startingPrice,
        locationShort: v.locationShort,
        ratingAverage: v.ratingAverage,
        photos: v.photos,
        venueType: v.venueType
      }
    })

    res.json({ data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

router.get("/popular", async (req, res) => {
  try {
    const agg = await Booking.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: "$venueId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $lookup: { from: "venues", localField: "_id", foreignField: "_id", as: "venue" } },
      { $unwind: "$venue" },
      { $match: { "venue.approved": true, "venue.approvalStatus": "approved" } }
    ])
    const data = agg.map(a => ({
      id: a.venue._id,
      name: a.venue.name,
      sports: a.venue.sports,
      startingPrice: a.venue.courts?.length ? Math.min(...a.venue.courts.map(c => c.pricePerHour)) : 0,
      locationShort: a.venue.locationShort,
      ratingAverage: a.venue.ratingAverage,
      photos: a.venue.photos
    }))
    res.json({ data })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const v = await Venue.findById(req.params.id).lean()
    if (!v || !v.approved || v.approvalStatus !== "approved") return res.status(404).json({ error: "Not found" })
    res.json({
      id: v._id,
      name: v.name,
      description: v.description,
      address: v.address,
      city: v.city,
      locationShort: v.locationShort,
      venueType: v.venueType,
      sports: v.sports,
      amenities: v.amenities,
      photos: v.photos,
      ratingAverage: v.ratingAverage,
      courts: v.courts
    })
  } catch (e) {
    res.status(500).json({ error: "Server error" })
  }
})

router.get("/:id/courts", async (req, res) => {
  const v = await Venue.findById(req.params.id).lean()
  if (!v) return res.status(404).json({ error: "Not found" })
  res.json({ courts: v.courts.map(c => ({ id: c._id, name: c.name, sportType: c.sportType, pricePerHour: c.pricePerHour, operatingHours: c.operatingHours })) })
})

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function generateSlotsByHours(open = "06:00", close = "23:00") {
  const startM = toMinutes(open)
  const endM = toMinutes(close)
  const slots = []
  for (let m = startM; m + 60 <= endM; m += 60) {
    const h = Math.floor(m / 60)
    const start = `${String(h).padStart(2, "0")}:00`
    const end = `${String(h + 1).padStart(2, "0")}:00`
    slots.push({ start, end })
  }
  return slots
}

router.get("/:venueId/courts/:courtId/availability", async (req, res) => {
  const { venueId, courtId } = req.params
  const { date } = req.query // YYYY-MM-DD
  if (!date) return res.status(400).json({ error: "Missing date" })

  const v = await Venue.findById(venueId).lean()
  if (!v || !v.approved || v.approvalStatus !== "approved") return res.status(404).json({ error: "Venue not found" })
  const court = v.courts?.find(c => String(c._id) === String(courtId))
  if (!court) return res.status(404).json({ error: "Court not found" })

  const bookings = await Booking.find({ venueId, courtId, date, status: { $ne: "cancelled" } }).lean()
  const blocks = await Block.find({ venueId, courtId, date }).lean()

  const slots = generateSlotsByHours(court.operatingHours?.open, court.operatingHours?.close).map(s => {
    const takenByBooking = bookings.some(b => b.startTime === s.start && b.endTime === s.end)
    const blocked = blocks.some(bl => s.start >= bl.startTime && s.end <= bl.endTime)
    return { ...s, available: !(takenByBooking || blocked) }
  })
  res.json({ slots })
})

export default router