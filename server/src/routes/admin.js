import express from "express";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { User } from "../models/User.js";
import { Venue } from "../models/Venue.js";
import { Booking } from "../models/Booking.js";
import { Report } from "../models/Report.js";

const createAdminRouter = (io) => {
  const router = express.Router();

  // KPIs
  router.get(
    "/stats/kpis",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const [totalUsers, totalFacilityOwners, totalBookings] = await Promise.all([
          User.countDocuments({}),
          User.countDocuments({ role: "facility" }),
          Booking.countDocuments({}),
        ]);
        const activeCourtsAgg = await Venue.aggregate([
          { $match: { approved: true, approvalStatus: "approved" } },
          { $project: { count: { $size: "$courts" } } },
          { $group: { _id: null, total: { $sum: "$count" } } },
        ]);
        const totalActiveCourts = activeCourtsAgg[0]?.total || 0;
        res.json({ totalUsers, totalFacilityOwners, totalBookings, totalActiveCourts });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch KPIs" });
      }
    }
  );

  // Booking Activity Over Time
  router.get(
    "/stats/booking-activity",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const { period = "daily", limit = 30 } = req.query;
        let groupId;
        if (period === "monthly") groupId = { $substr: ["$date", 0, 7] }; // YYYY-MM
        else if (period === "weekly")
          groupId = {
            $concat: [
              {
                $toString: {
                  $isoWeekYear: {
                    $toDate: {
                      $concat: ["$date", "T", "$startTime", ":00Z"],
                    },
                  },
                },
              },
              "-W",
              {
                $toString: {
                  $isoWeek: {
                    $toDate: {
                      $concat: ["$date", "T", "$startTime", ":00Z"],
                    },
                  },
                },
              },
            ],
          };
        else groupId = "$date"; // daily

        const data = await Booking.aggregate([
          { $group: { _id: groupId, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
          { $limit: Number(limit) },
        ]);
        res.json({ data });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch booking activity" });
      }
    }
  );

  // User Registration Trends
  router.get(
    "/stats/user-registrations",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const data = await User.aggregate([
          {
            $group: {
              _id: {
                $dateToString: { date: "$createdAt", format: "%Y-%m-%d" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 60 },
        ]);
        res.json({ data });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch user registrations" });
      }
    }
  );

  // Facility Approval Trend
  router.get(
    "/stats/facility-approval-trend",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const data = await Venue.aggregate([
          {
            $group: {
              _id: { $dateToString: { date: "$createdAt", format: "%Y-%m" } },
              pending: {
                $sum: { $cond: [{ $eq: ["$approvalStatus", "pending"] }, 1, 0] },
              },
              approved: {
                $sum: { $cond: [{ $eq: ["$approvalStatus", "approved"] }, 1, 0] },
              },
              rejected: {
                $sum: { $cond: [{ $eq: ["$approvalStatus", "rejected"] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 24 },
        ]);
        res.json({ data });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch facility approval trend" });
      }
    }
  );

  // Most Active Sports
  router.get(
    "/stats/most-sports",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const data = await Booking.aggregate([
          { $group: { _id: "$sportType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]);
        const labels = data.map((d) => d._id);
        const values = data.map((d) => d.count);
        res.json({ labels, values });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch most active sports" });
      }
    }
  );

  // Earnings Simulation
  router.get(
    "/stats/earnings",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const data = await Booking.aggregate([
          { $group: { _id: { $substr: ["$date", 0, 7] }, revenue: { $sum: "$priceTotal" } } },
          { $sort: { _id: 1 } },
          { $limit: 24 },
        ]);
        res.json({ data });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch earnings data" });
      }
    }
  );

  // Facility Approval Page
  router.get(
    "/venues/pending",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const venues = await Venue.find({
          $or: [{ approvalStatus: "pending" }, { approved: false }],
        })
          .sort({ createdAt: -1 })
          .lean();
        res.json({ data: venues.map((v) => ({ ...v, id: v._id })) });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch pending venues" });
      }
    }
  );

  router.get(
    "/venues/:id",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const v = await Venue.findById(req.params.id).lean();
        if (!v) return res.status(404).json({ error: "Not found" });
        res.json({ ...v, id: v._id });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch venue details" });
      }
    }
  );

  router.patch(
    "/venues/:id/approve",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const { comment = "" } = req.body;
        const v = await Venue.findById(req.params.id);
        if (!v) return res.status(404).json({ error: "Not found" });
        v.approvalStatus = "approved";
        v.approved = true;
        v.approvalComment = comment;
        await v.save();
        res.json({ message: "Approved" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to approve venue" });
      }
    }
  );

  router.patch(
    "/venues/:id/reject",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const { comment = "" } = req.body;
        const v = await Venue.findById(req.params.id);
        if (!v) return res.status(404).json({ error: "Not found" });
        v.approvalStatus = "rejected";
        v.approved = false;
        v.approvalComment = comment;
        await v.save();
        res.json({ message: "Rejected" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to reject venue" });
      }
    }
  );

  // User Management
  router.get(
    "/users",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const { role, status, q } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (q) filter.$or = [{ email: new RegExp(q, "i") }, { fullName: new RegExp(q, "i") }];
        const users = await User.find(filter).sort({ createdAt: -1 }).lean();
        res.json({
          data: users.map((u) => ({
            id: u._id,
            email: u.email,
            fullName: u.fullName,
            role: u.role,
            status: u.status,
            createdAt: u.createdAt,
          })),
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch users" });
      }
    }
  );

  router.patch(
    "/users/:id/ban",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const user = await User.findByIdAndUpdate(req.params.id, { status: "banned" }, { new: true }).lean();
        if (!user) return res.status(404).json({ error: "Not found" });
        res.json({ message: "Banned" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to ban user" });
      }
    }
  );

  router.patch(
    "/users/:id/unban",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const user = await User.findByIdAndUpdate(req.params.id, { status: "active" }, { new: true }).lean();
        if (!user) return res.status(404).json({ error: "Not found" });
        res.json({ message: "Unbanned" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to unban user" });
      }
    }
  );

  router.get(
    "/users/:id/bookings",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const bookings = await Booking.find({ userId: req.params.id }).sort({ createdAt: -1 }).lean();
        // join venue and court names
        const venueIds = [...new Set(bookings.map((b) => String(b.venueId)))].map(
          (id) => new mongoose.Types.ObjectId(id)
        );
        const venues =
          venueIds.length > 0
            ? await mongoose.connection.collection("venues").find({ _id: { $in: venueIds } }).toArray()
            : [];
        const vMap = new Map(venues.map((v) => [String(v._id), v]));
        const data = bookings.map((b) => {
          const v = vMap.get(String(b.venueId));
          const court = v?.courts?.find((c) => String(c._id) === String(b.courtId));
          return {
            id: b._id,
            venueName: v?.name,
            courtName: court?.name,
            sportType: b.sportType,
            date: b.date,
            time: `${b.startTime} - ${b.endTime}`,
            status: b.status,
            priceTotal: b.priceTotal,
          };
        });
        res.json({ data });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch user bookings" });
      }
    }
  );

  // Reports (Optional moderation)
  router.get(
    "/reports",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const reports = await Report.find({}).sort({ createdAt: -1 }).lean();
        res.json({ data: reports.map((r) => ({ ...r, id: r._id })) });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch reports" });
      }
    }
  );

  router.patch(
    "/reports/:id/resolve",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const r = await Report.findByIdAndUpdate(req.params.id, { status: "resolved" }, { new: true }).lean();
        if (!r) return res.status(404).json({ error: "Not found" });
        res.json({ message: "Report resolved" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to resolve report" });
      }
    }
  );

  router.patch(
    "/reports/:id/dismiss",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      try {
        const r = await Report.findByIdAndUpdate(req.params.id, { status: "dismissed" }, { new: true }).lean();
        if (!r) return res.status(404).json({ error: "Not found" });
        res.json({ message: "Report dismissed" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to dismiss report" });
      }
    }
  );

  // New endpoint: Send global notification to all users
  router.post(
    "/notify-all",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      const { message, type = "alert", priority = "normal" } = req.body;

      if (!message || message.trim() === "") {
        return res.status(400).json({ error: "Message is required" });
      }

      try {
        // Emit to all connected clients
        io.emit("globalNotification", { message, type, priority, timestamp: new Date() });

        // TODO: Optionally save notification in DB

        return res.status(200).json({ success: true, message: "Global notification sent" });
      } catch (err) {
        console.error("Failed to send global notification:", err);
        res.status(500).json({ error: "Failed to send global notification" });
      }
    }
  );

  // New endpoint: Send warning message to a specific user
  router.post(
    "/notify-warning",
    authRequired,
    requireRole("admin"),
    async (req, res) => {
      const { userId, message } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      if (!message || message.trim() === "") {
        return res.status(400).json({ error: "Message is required" });
      }

      try {
        // Emit warning event to specific user room/ID
        // This assumes you have a way to join user rooms on client connection
        io.to(userId).emit("userWarning", { message, timestamp: new Date() });

        // TODO: Optionally save notification in DB

        return res.status(200).json({ success: true, message: `Warning sent to user ${userId}` });
      } catch (err) {
        console.error("Failed to send warning notification:", err);
        res.status(500).json({ error: "Failed to send warning notification" });
      }
    }
  );

  return router;
};

export default createAdminRouter;
