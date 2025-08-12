"use client"
import React from "react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { api } from "../api/axios"
import dayjs from "dayjs"
import { useAuth } from "../context/AuthContext"

export default function BookCourt() {
  const { venueId } = useParams()
  const [searchParams] = useSearchParams()
  const { user, socket } = useAuth()
  const navigate = useNavigate()

  const [venue, setVenue] = useState(null)
  const [courtId, setCourtId] = useState(searchParams.get("courtId") || "")
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"))
  const [slots, setSlots] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("razorpay")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentStep, setPaymentStep] = useState(1)

  const selectedCourt = useMemo(() => venue?.courts?.find((c) => c._id === courtId), [venue, courtId])

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  useEffect(() => {
    api.get(`/venues/${venueId}`).then((res) => setVenue(res.data))
  }, [venueId])

  const fetchAvailability = async () => {
    if (!courtId || !date) return
    const res = await api.get(`/venues/${venueId}/courts/${courtId}/availability`, { params: { date } })
    setSlots(res.data.slots)
  }

  useEffect(() => {
    fetchAvailability()
  }, [courtId, date])

  useEffect(() => {
    if (socket && courtId && date) {
      socket.emit("join:courtDate", { courtId, date })
      const onTaken = ({ startTime }) => {
        setSlots((prev) => prev.map((s) => (s.start === startTime ? { ...s, available: false } : s)))
      }
      const onReleased = ({ startTime }) => {
        setSlots((prev) => prev.map((s) => (s.start === startTime ? { ...s, available: true } : s)))
      }
      socket.on("booking:slot-taken", onTaken)
      socket.on("booking:slot-released", onReleased)
      return () => {
        socket.off("booking:slot-taken", onTaken)
        socket.off("booking:slot-released", onReleased)
      }
    }
  }, [socket, courtId, date])

  const processRazorpayPayment = (orderData) => {
    return new Promise((resolve, reject) => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "QuickCourt",
        description: `Court booking at ${venue.name}`,
        order_id: orderData.id,
        handler: (response) => {
          resolve({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          })
        },
        prefill: {
          name: user.fullName,
          email: user.email,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            reject(new Error("Payment cancelled"))
          },
        },
      }
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        reject(new Error("Razorpay not loaded"))
      }
    })
  }

  const processStripePayment = async (clientSecret) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          payment_intent: "pi_" + Math.random().toString(36).substr(2, 9),
          status: "succeeded",
        })
      }, 2000)
    })
  }

  const processFakePayment = () => {
    return new Promise((resolve) => {
      setPaymentStep(2)
      setTimeout(() => {
        setPaymentStep(3)
        setTimeout(() => {
          resolve({
            payment_id: "pay_" + Math.random().toString(36).substr(2, 9),
            order_id: "order_" + Math.random().toString(36).substr(2, 9),
            status: "success",
          })
        }, 1500)
      }, 2000)
    })
  }

  const confirm = async () => {
    if (!user) return navigate("/login")
    if (!selected) return alert("Please select a time slot")
    setShowPaymentModal(true)
    setPaymentStep(1)
  }

  const handlePaymentConfirm = async () => {
    setLoading(true)
    try {
      // Validate required fields before making the request
      if (!venueId || !courtId || !date || !selected) {
        throw new Error("Missing required booking information")
      }

      const paymentResult = await processFakePayment()

      const bookingData = {
        venueId: venueId,
        courtId: courtId,
        date: date,
        startTime: selected.start,
        endTime: selected.end,
        paymentId: paymentResult.payment_id,
        orderId: paymentResult.order_id,
        paymentMethod: paymentMethod,
        paymentDetails: paymentResult,
        userId: user?.id || user?._id,
        priceTotal: selectedCourt?.pricePerHour,
        duration: 1, // hours
      }

      console.log("Sending booking request:", bookingData) // Debug log

      const bookingRes = await api.post("/bookings", bookingData)

      setTimeout(() => {
        setShowPaymentModal(false)
        navigate("/bookings", {
          state: {
            success: true,
            bookingId: bookingRes.data.bookingId || bookingRes.data.id,
          },
        })
      }, 1000)
    } catch (error) {
      console.error("Booking error:", error)

      let errorMessage = "Booking failed. Please try again."

      if (error.response) {
        // Server responded with error status
        const status = error.response.status
        const data = error.response.data

        if (status === 400) {
          errorMessage = data.message || "Invalid booking data. Please check your selection."
        } else if (status === 401) {
          errorMessage = "Please log in to make a booking."
          navigate("/login")
          return
        } else if (status === 409) {
          errorMessage = "This time slot is no longer available. Please select another time."
        } else if (status === 500) {
          errorMessage = "Server error. Please try again in a few moments."
        } else {
          errorMessage = data.message || `Error ${status}: ${data.error || "Unknown error"}`
        }
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection and try again."
      } else {
        // Other error
        errorMessage = error.message || "An unexpected error occurred."
      }

      alert(errorMessage)
      setShowPaymentModal(false)
      setPaymentStep(1)
      fetchAvailability() // Refresh availability
    } finally {
      setLoading(false)
    }
  }

  if (!venue) return <div className="container">Loading...</div>

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h2>Book: {venue.name}</h2>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label>Pick Court</label>
          <select className="select" value={courtId} onChange={(e) => setCourtId(e.target.value)}>
            <option value="">Select court</option>
            {venue.courts?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} • {c.sportType} • ₹{c.pricePerHour}/hr
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={dayjs().format("YYYY-MM-DD")}
          />
        </div>
        <div>
          <label>Payment Method</label>
          <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="razorpay">Razorpay</option>
            <option value="stripe">Stripe</option>
          </select>
        </div>
      </div>

      <div className="hr"></div>

      <h3>Available Time Slots</h3>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {slots.map((s) => (
          <button
            key={s.start}
            className="btn ghost"
            disabled={!s.available}
            style={{
              margin: 6,
              background: selected?.start === s.start ? "#dcfce7" : undefined,
              borderColor: s.available ? "#e5e7eb" : "#fca5a5",
              color: s.available ? undefined : "#9ca3af",
              cursor: s.available ? "pointer" : "not-allowed",
            }}
            onClick={() => s.available && setSelected(s)}
          >
            {s.start} - {s.end}
          </button>
        ))}
        {slots.length === 0 && <p className="text-muted">No slots available for selected date</p>}
      </div>

      <div className="hr"></div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h4>Booking Summary</h4>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <span>Court:</span>
          <span>{selectedCourt?.name || "Not selected"}</span>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <span>Date:</span>
          <span>{dayjs(date).format("DD MMM YYYY")}</span>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <span>Time:</span>
          <span>{selected ? `${selected.start} - ${selected.end}` : "Not selected"}</span>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <span>Duration:</span>
          <span>1 hour</span>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <span>Price:</span>
          <span>
            <strong>₹{selectedCourt?.pricePerHour || 0}</strong>
          </span>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <span>Payment Method:</span>
          <span className="badge">{paymentMethod === "razorpay" ? "Razorpay" : "Stripe"}</span>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn ghost" onClick={() => navigate(`/venues/${venueId}`)} disabled={loading}>
          Back to Venue
        </button>
        <button className="btn" disabled={!selected || loading} onClick={confirm} style={{ minWidth: 150 }}>
          {loading ? "Processing..." : `Pay ₹${selectedCourt?.pricePerHour || 0} & Book`}
        </button>
      </div>

      {showPaymentModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            {paymentStep === 1 && (
              <>
                <h3 style={{ marginBottom: "20px", textAlign: "center" }}>Complete Payment</h3>
                <div className="payment-details" style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Court:</span>
                    <span>{selectedCourt?.name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Date:</span>
                    <span>{dayjs(date).format("DD MMM YYYY")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Time:</span>
                    <span>
                      {selected?.start} - {selected?.end}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    <span>Total Amount:</span>
                    <span>₹{selectedCourt?.pricePerHour}</span>
                  </div>
                </div>
                <div
                  className="payment-method"
                  style={{ marginBottom: "20px", padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: paymentMethod === "razorpay" ? "#3395ff" : "#635bff",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        marginRight: "12px",
                      }}
                    >
                      {paymentMethod === "razorpay" ? "R" : "S"}
                    </div>
                    <span style={{ fontWeight: "500" }}>
                      {paymentMethod === "razorpay" ? "Razorpay" : "Stripe"} Payment
                    </span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
                    Secure payment powered by {paymentMethod === "razorpay" ? "Razorpay" : "Stripe"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button className="btn ghost" onClick={() => setShowPaymentModal(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button className="btn" onClick={handlePaymentConfirm} style={{ flex: 1 }}>
                    Pay ₹{selectedCourt?.pricePerHour}
                  </button>
                </div>
              </>
            )}

            {paymentStep === 2 && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div className="spinner"></div>
                <h3>Processing Payment...</h3>
                <p style={{ color: "#666" }}>Please wait while we process your payment</p>
              </div>
            )}

            {paymentStep === 3 && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#10b981",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    color: "white",
                    fontSize: "24px",
                  }}
                >
                  ✓
                </div>
                <h3 style={{ color: "#10b981" }}>Payment Successful!</h3>
                <p style={{ color: "#666" }}>Your court has been booked successfully</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
