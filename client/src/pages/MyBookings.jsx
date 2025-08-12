"use client"
import React from "react"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { api } from "../api/axios"
import { useAuth } from "../context/AuthContext"

export default function MyBookings() {
  const [items, setItems] = useState([])
  const { socket } = useAuth()
  const location = useLocation()
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (location.state?.success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
      // Clear the state to prevent showing again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const load = async () => {
    try {
      const res = await api.get("/bookings/my")
      setItems(res.data.data || [])
    } catch (err) {
      console.error("Failed to load bookings", err)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!socket) return
    const onCreated = () => load()
    const onUpdated = () => load()
    socket.on("booking:created", onCreated)
    socket.on("booking:updated", onUpdated)
    return () => {
      socket.off("booking:created", onCreated)
      socket.off("booking:updated", onUpdated)
    }
  }, [socket])

  const cancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return
    try {
      await api.patch(`/bookings/${id}/cancel`)
      load()
    } catch (err) {
      console.error("Failed to cancel booking", err)
      alert("Failed to cancel booking. Please try again.")
    }
  }

  return (
    <div className="container">
      <h2>My Bookings</h2>

      {showSuccess && (
        <div
          style={{
            backgroundColor: "#d1fae5",
            border: "1px solid #10b981",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              backgroundColor: "#10b981",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
            }}
          >
            ✓
          </div>
          <div>
            <h4 style={{ margin: 0, color: "#065f46" }}>Booking Confirmed!</h4>
            <p style={{ margin: 0, color: "#047857" }}>Your payment was successful and court has been booked.</p>
          </div>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Venue</th>
            <th>Sport</th>
            <th>Court</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Price</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ color: "#666" }}>
                  <h4>No bookings yet</h4>
                  <p>Your court bookings will appear here once you make a reservation.</p>
                </div>
              </td>
            </tr>
          ) : (
            items.map((b) => (
              <tr key={b.id}>
                <td>{b.venueName}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: "#e0f2fe", color: "#0277bd" }}>
                    {b.sportType}
                  </span>
                </td>
                <td>{b.courtName}</td>
                <td>{b.date}</td>
                <td>{b.time}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      backgroundColor:
                        b.status === "confirmed" ? "#d1fae5" : b.status === "cancelled" ? "#fee2e2" : "#fef3c7",
                      color: b.status === "confirmed" ? "#065f46" : b.status === "cancelled" ? "#991b1b" : "#92400e",
                    }}
                  >
                    {b.status}
                  </span>
                </td>
                <td>₹{b.priceTotal}</td>
                <td>
                  {b.status === "confirmed" && (
                    <button className="btn ghost" onClick={() => cancel(b.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
