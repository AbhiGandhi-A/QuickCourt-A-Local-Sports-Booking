import express from "express";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();

// Send global notification (admin only)
router.post(
  "/notify-all",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    const { message, type = "alert", priority = "normal" } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // Save notification with userId=null for global
      const notification = new Notification({
        userId: null,
        message,
        type,
        priority,
      });
      await notification.save();

      // Emit to all connected clients
      req.app.get("io").emit("notification", {
        id: notification._id,
        userId: null,
        message,
        type,
        priority,
        createdAt: notification.createdAt,
      });

      res.json({ success: true, message: "Global notification sent" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to send global notification" });
    }
  }
);

// Send notification to a specific user (admin only)
router.post(
  "/notify-user",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    const { userId, message, type = "alert", priority = "normal" } = req.body;

    if (!userId) return res.status(400).json({ error: "userId is required" });
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // Save notification for specific user
      const notification = new Notification({
        userId,
        message,
        type,
        priority,
      });
      await notification.save();

      // Emit to user's socket room
      req.app.get("io").to(userId).emit("notification", {
        id: notification._id,
        userId,
        message,
        type,
        priority,
        createdAt: notification.createdAt,
      });

      res.json({ success: true, message: `Notification sent to user ${userId}` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to send notification" });
    }
  }
);

// Get notifications for current logged-in user
router.get("/my", authRequired, async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({
      $or: [{ userId }, { userId: null }],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.patch("/:id/read", authRequired, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: { $in: [req.user._id, null] } },
      { read: true },
      { new: true }
    ).lean();

    if (!notification)
      return res.status(404).json({ error: "Notification not found" });

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

export default router;
