import React, { useEffect, useState } from "react"
import { api } from "../../api/axios"

export default function FacilityBookings() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState("")

  const load = async () => {
    const res = await api.get("/facility/bookings", { params: { status: status || undefined } })
    setItems(res.data.data || [])
  }

  useEffect(() => { load() }, [status])

  const markCompleted = async (id) => {
    await api.patch(`/facility/bookings/${id}/complete`)
    load()
  }

  return (
    <div>
      <h2>Bookings Overview</h2>
      <div className="row">
        <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="confirmed">Booked</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>User</th><th>Venue</th><th>Court</th><th>Sport</th><th>Date</th><th>Time</th><th>Status</th><th>Price</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.map(b => (
            <tr key={b.id}>
              <td>{b.userName}</td>
              <td>{b.venueName}</td>
              <td>{b.courtName}</td>
              <td>{b.sportType}</td>
              <td>{b.date}</td>
              <td>{b.time}</td>
              <td>{b.status}</td>
              <td>${b.priceTotal}</td>
              <td>
                {b.status === "confirmed" ? <button className="btn ghost" onClick={() => markCompleted(b.id)}>Mark Completed</button> : null}
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan="9">No bookings.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}