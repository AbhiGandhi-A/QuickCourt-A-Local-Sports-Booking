import React, { useEffect, useState } from "react"
import dayjs from "dayjs"
import { api } from "../../api/axios"

export default function FacilitySlots() {
  const [venues, setVenues] = useState([])
  const [venueId, setVenueId] = useState("")
  const [courts, setCourts] = useState([])
  const [courtId, setCourtId] = useState("")
  const [blocks, setBlocks] = useState([])
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"))
  const [startTime, setStartTime] = useState("10:00")
  const [endTime, setEndTime] = useState("12:00")
  const [reason, setReason] = useState("Maintenance")

  const loadVenues = async () => {
    const res = await api.get("/facility/venues/my")
    const vs = res.data.data || []
    setVenues(vs)
    if (!venueId && vs[0]) setVenueId(vs[0].id)
  }

  const loadCourts = async (vid) => {
    if (!vid) { setCourts([]); setCourtId(""); return }
    const res = await api.get(`/venues/${vid}/courts`)
    setCourts(res.data.courts || [])
    if (!courtId && res.data.courts?.[0]) setCourtId(res.data.courts[0].id)
  }

  const loadBlocks = async (vid, cid) => {
    if (!vid || !cid) { setBlocks([]); return }
    const res = await api.get(`/facility/venues/${vid}/courts/${cid}/blocks`)
    setBlocks(res.data.data || [])
  }

  useEffect(() => { loadVenues() }, [])
  useEffect(() => { loadCourts(venueId) }, [venueId])
  useEffect(() => { loadBlocks(venueId, courtId) }, [venueId, courtId])

  const addBlock = async (e) => {
    e.preventDefault()
    await api.post(`/facility/venues/${venueId}/courts/${courtId}/blocks`, { date, startTime, endTime, reason })
    loadBlocks(venueId, courtId)
  }

  const removeBlock = async (id) => {
    await api.delete(`/facility/blocks/${id}`)
    loadBlocks(venueId, courtId)
  }

  return (
    <div>
      <h2>Time Slot Management</h2>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", gap: 8 }}>
        <select className="select" value={venueId} onChange={e => setVenueId(e.target.value)}>
          <option value="">Select Venue</option>
          {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="select" value={courtId} onChange={e => setCourtId(e.target.value)}>
          <option value="">Select Court</option>
          {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        <input className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        <input className="input" placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} />
        <button className="btn" onClick={addBlock} style={{ gridColumn: "1 / -1" }}>Block Time</button>
      </div>

      <h3 style={{ marginTop: 16 }}>Existing Blocks</h3>
      <table className="table">
        <thead><tr><th>Date</th><th>Start</th><th>End</th><th>Reason</th><th></th></tr></thead>
        <tbody>
          {blocks.map(b => (
            <tr key={b.id}>
              <td>{b.date}</td>
              <td>{b.startTime}</td>
              <td>{b.endTime}</td>
              <td>{b.reason}</td>
              <td><button className="btn ghost" onClick={() => removeBlock(b.id)}>Remove</button></td>
            </tr>
          ))}
          {blocks.length === 0 && <tr><td colSpan="5">No blocks.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}