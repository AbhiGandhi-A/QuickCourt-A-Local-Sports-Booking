import express from "express"
import Razorpay from "razorpay"
import crypto from "crypto"
import { authRequired } from "../middleware/auth.js"

const router = express.Router()

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Create payment order
router.post("/create-order", authRequired, async (req, res) => {
  try {
    const { venueId, courtId, date, startTime, endTime, amount, paymentMethod } = req.body

    if (!venueId || !courtId || !date || !startTime || !endTime || !amount) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (paymentMethod === "razorpay") {
      // Create Razorpay order
      const options = {
        amount: amount, // amount in paise
        currency: "INR",
        receipt: `booking_${Date.now()}_${req.user.id}`,
        notes: {
          venueId,
          courtId,
          date,
          startTime,
          endTime,
          userId: req.user.id,
        },
      }

      const order = await razorpay.orders.create(options)

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        },
      })
    } else if (paymentMethod === "stripe") {
      // For Stripe integration (placeholder)
      const clientSecret = `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`

      res.json({
        success: true,
        clientSecret,
        amount: amount / 100, // Convert back to rupees for Stripe
      })
    } else {
      res.status(400).json({ error: "Invalid payment method" })
    }
  } catch (error) {
    console.error("Payment order creation error:", error)
    res.status(500).json({ error: "Failed to create payment order" })
  }
})

// Verify Razorpay payment
router.post("/verify-payment", authRequired, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification data" })
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, verified: true })
    } else {
      res.status(400).json({ error: "Payment verification failed" })
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    res.status(500).json({ error: "Payment verification failed" })
  }
})

export default router
