import React, { useEffect, useState } from "react"
import { api } from "../../api/axios"

export default function AdminApprovals() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState("")

  const load = async () => {
    const res = await api.get("/admin/venues/pending")
    setItems(res.data.data || [])
    setSelected(null)
  }

  useEffect(() => { load() }, [])

  const view = async (id) => {
    const res = await api.get(`/admin/venues/${id}`)
    setSelected(res.data)
    setComment("")
  }

  const approve = async () => {
    if (!selected) return
    await api.patch(`/admin/venues/${selected._id}/approve`, { comment })
    load()
  }

  const reject = async () => {
    if (!selected) return
    await api.patch(`/admin/venues/${selected._id}/reject`, { comment })
    load()
  }

  return (
    <div>
      <h2>Facility Approval</h2>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
        <div className="card" style={{ padding: 12 }}>
          <h4>Pending Venues</h4>
          <ul>
            {items.map(v => (
              <li key={v.id} className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <strong>{v.name}</strong> <span className="badge">{v.city}</span>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{v.venueType} • Sports: {v.sports?.join(", ")}</div>
                </div>
                <button className="btn ghost" onClick={() => view(v.id)}>View</button>
              </li>
            ))}
            {items.length === 0 && <p>No pending venues.</p>}
          </ul>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <h4>Details</h4>
          {!selected ? <p>Select a venue.</p> : (
            <>
              <h3>{selected.name}</h3>
              <p>{selected.address}, {selected.city}</p>
              <p>{selected.description}</p>
              <p>Type: {selected.venueType}</p>
              <p>Sports: {selected.sports?.join(", ")}</p>
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                {selected.photos?.length ? selected.photos.map(p => (
                  <img key={p} src={p || "/placeholder.svg"} width="100" height="80" style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
                )) : <span className="badge">No photos</span>}
              </div>
              <div className="hr"></div>
              <label>Admin Comment</label>
              <textarea className="input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional comment..." style={{ minHeight: 80 }} />
              <div className="row" style={{ marginTop: 8, gap: 8 }}>
                <button className="btn" onClick={approve}>Approve</button>
                <button className="btn ghost" onClick={reject}>Reject</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}