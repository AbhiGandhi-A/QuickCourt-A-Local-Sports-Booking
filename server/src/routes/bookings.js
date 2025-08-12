import express from "express"
import dayjs from "dayjs"
import { authRequired } from "../middleware/auth.js"
import { Booking } from "../models/Booking.js"
import { Venue } from "../models/Venue.js"
import { getIO } from "../../socket.js"

const router = express.Router()

// Get current user's bookings
router.get("/my", authRequired, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean()

    const venueIds = [...new Set(bookings.map((b) => String(b.venueId)))]
    const venues = await Venue.find({ _id: { $in: venueIds } }).lean()
    const venueMap = new Map(venues.map((v) => [String(v._id), v]))

    const data = bookings.map((b) => {
      const v = venueMap.get(String(b.venueId))
      const court = v?.courts?.find((c) => String(c._id) === String(b.courtId))
      return {
        id: b._id,
        venueName: v?.name,
        sportType: b.sportType,
        courtName: court?.name,
        date: b.date,
        time: `${b.startTime} - ${b.endTime}`,
        status: b.status,
        priceTotal: b.priceTotal,
      }
    })

    res.json({ data })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

// Create a booking
router.post("/", authRequired, async (req, res) => {
  try {
    const { venueId, courtId, date, startTime, endTime } = req.body

    if (!venueId || !courtId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing fields" })
    }

    const venue = await Venue.findById(venueId).lean()
    if (!venue) return res.status(404).json({ error: "Venue not found" })

    const court = venue.courts.find((c) => String(c._id) === String(courtId))
    if (!court) return res.status(404).json({ error: "Court not found" })

    // Prevent booking past times
    const now = dayjs()
    const startsAt = dayjs(`${date}T${startTime}:00`)
    if (startsAt.isBefore(now)) {
      return res.status(400).json({ error: "Cannot book past times" })
    }

    // Check if slot already booked (excluding cancelled)
    const exists = await Booking.findOne({
      venueId,
      courtId,
      date,
      startTime,
      endTime,
      status: { $ne: "cancelled" },
    })

    if (exists) {
      return res.status(409).json({ error: "Slot already booked" })
    }

    const priceTotal = court.pricePerHour // calculate based on your logic

    const booking = await Booking.create({
      userId: req.user.id,
      venueId,
      courtId,
      sportType: court.sportType,
      date,
      startTime,
      endTime,
      priceTotal,
      status: "confirmed",
      paymentStatus: "paid",
    })

    const io = getIO()

    // Notify the user
    io.to(`user:${req.user.id}`).emit("booking:created", {
      id: booking._id,
      venueId,
      courtId,
      date,
      startTime,
      endTime,
      status: booking.status,
    })

    // Notify viewers of this court/date to refresh availability
    io.to(`court:${courtId}:${date}`).emit("booking:slot-taken", { courtId, date, startTime, endTime })

    res.json({ message: "Booking confirmed", bookingId: booking._id })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

// Cancel a booking
router.patch("/:id/cancel", authRequired, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id })
    if (!booking) return res.status(404).json({ error: "Not found" })

    const startsAt = dayjs(`${booking.date}T${booking.startTime}:00`)
    if (startsAt.isBefore(dayjs())) {
      return res.status(400).json({ error: "Cannot cancel past booking" })
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({ error: "Cannot cancel" })
    }

    booking.status = "cancelled"
    await booking.save()

    const io = getIO()

    io.to(`user:${req.user.id}`).emit("booking:updated", {
      id: booking._id,
      status: "cancelled",
    })

    io.to(`court:${booking.courtId}:${booking.date}`).emit("booking:slot-released", {
      courtId: booking.courtId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
    })

    res.json({ message: "Booking cancelled" })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

export default router
