import React, { useEffect, useState } from "react"
import { api } from "../../api/axios"

export default function FacilityCourts() {
  const [venues, setVenues] = useState([])
  const [selectedVenue, setSelectedVenue] = useState("")
  const [venueDetails, setVenueDetails] = useState(null)
  const [form, setForm] = useState({ name: "", sportType: "badminton", pricePerHour: 10, open: "06:00", close: "23:00" })

  const loadVenues = async () => {
    const res = await api.get("/facility/venues/my")
    setVenues(res.data.data || [])
    if (!selectedVenue && res.data.data?.[0]) setSelectedVenue(res.data.data[0].id)
  }

  const loadVenueDetails = async (id) => {
    if (!id) { setVenueDetails(null); return }
    const res = await api.get(`/venues/${id}`)
    setVenueDetails(res.data)
  }

  useEffect(() => { loadVenues() }, [])
  useEffect(() => { loadVenueDetails(selectedVenue) }, [selectedVenue])

  const addCourt = async (e) => {
    e.preventDefault()
    await api.post(`/facility/venues/${selectedVenue}/courts`, form)
    setForm({ name: "", sportType: "badminton", pricePerHour: 10, open: "06:00", close: "23:00" })
    loadVenueDetails(selectedVenue)
  }

  const updateCourt = async (courtId, patch) => {
    await api.put(`/facility/venues/${selectedVenue}/courts/${courtId}`, patch)
    loadVenueDetails(selectedVenue)
  }

  const removeCourt = async (courtId) => {
    await api.delete(`/facility/venues/${selectedVenue}/courts/${courtId}`)
    loadVenueDetails(selectedVenue)
  }

  return (
    <div>
      <h2>Manage Courts</h2>
      <div className="row">
        <select className="select" value={selectedVenue} onChange={e => setSelectedVenue(e.target.value)}>
          <option value="">Select venue</option>
          {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      {venueDetails && (
        <>
          <div className="card" style={{ padding: 12, marginTop: 12 }}>
            <h3>Add Court</h3>
            <form onSubmit={addCourt} className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
              <input className="input" placeholder="Court name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <select className="select" value={form.sportType} onChange={e => setForm({ ...form, sportType: e.target.value })}>
                <option value="badminton">Badminton</option>
                <option value="football">Football</option>
                <option value="tennis">Tennis</option>
                <option value="table-tennis">Table Tennis</option>
              </select>
              <input className="input" type="number" placeholder="Price per hour" value={form.pricePerHour} onChange={e => setForm({ ...form, pricePerHour: Number(e.target.value) })} />
              <input className="input" type="time" value={form.open} onChange={e => setForm({ ...form, open: e.target.value })} />
              <input className="input" type="time" value={form.close} onChange={e => setForm({ ...form, close: e.target.value })} />
              <button className="btn" type="submit" style={{ gridColumn: "1 / -1" }}>Add Court</button>
            </form>
          </div>

          <h3 style={{ marginTop: 16 }}>Existing Courts</h3>
          <div className="grid grid-3">
            {venueDetails.courts?.map(c => (
              <div className="card" key={c._id}>
                <div className="body">
                  <h4>{c.name}</h4>
                  <p>{c.sportType} • ₹{c.pricePerHour}/hr</p>
                  <p>Hours: {c.operatingHours?.open} - {c.operatingHours?.close}</p>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn ghost" onClick={() => updateCourt(c._id, { pricePerHour: Number(prompt("New price", c.pricePerHour) || c.pricePerHour) })}>Edit Price</button>
                    <button className="btn ghost" onClick={() => updateCourt(c._id, { open: prompt("Open", c.operatingHours?.open) || c.operatingHours?.open, close: prompt("Close", c.operatingHours?.close) || c.operatingHours?.close })}>Edit Hours</button>
                    <button className="btn ghost" onClick={() => removeCourt(c._id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}