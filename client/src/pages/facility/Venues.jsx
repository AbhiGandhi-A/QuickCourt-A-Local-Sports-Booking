import React, { useEffect, useState } from "react"
import { api } from "../../api/axios"

export default function FacilityVenues() {
  const [venues, setVenues] = useState([])
  const [form, setForm] = useState({ name: "", description: "", address: "", city: "", locationShort: "", venueType: "mixed", sports: "", amenities: "" })
  const [photos, setPhotos] = useState([])

  const load = async () => {
    const res = await api.get("/facility/venues/my")
    setVenues(res.data.data || [])
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k,v]) => fd.append(k, v))
    for (const p of photos) fd.append("photos", p)
    await api.post("/facility/venues", fd, { headers: { "Content-Type": "multipart/form-data" } })
    setForm({ name: "", description: "", address: "", city: "", locationShort: "", venueType: "mixed", sports: "", amenities: "" })
    setPhotos([])
    load()
  }

  const addPhotos = async (venueId, files) => {
    const fd = new FormData()
    for (const p of files) fd.append("photos", p)
    await api.put(`/facility/venues/${venueId}`, fd, { headers: { "Content-Type": "multipart/form-data" } })
    load()
  }

  const updateField = async (venueId, key, value) => {
    const formData = new FormData()
    formData.append(key, value)
    await api.put(`/facility/venues/${venueId}`, formData)
    load()
  }

  const removePhoto = async (venueId, photoUrl) => {
    await api.delete(`/facility/venues/${venueId}/photos`, { data: { photoUrl } })
    load()
  }

  return (
    <div>
      <h2>Manage Venues</h2>

      <div className="card" style={{ padding: 12, marginBottom: 16 }}>
        <h3>Add Venue</h3>
        <form onSubmit={create} className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input className="input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <select className="select" value={form.venueType} onChange={e => setForm({ ...form, venueType: e.target.value })}>
            <option value="mixed">Mixed</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </select>
          <input className="input" placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <input className="input" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
          <input className="input" placeholder="Short Location" value={form.locationShort} onChange={e => setForm({ ...form, locationShort: e.target.value })} />
          <input className="input" placeholder="Sports (comma sep)" value={form.sports} onChange={e => setForm({ ...form, sports: e.target.value })} />
          <textarea className="input" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ gridColumn: "1 / -1", minHeight: 80 }} />
          <input type="file" multiple accept="image/*" onChange={e => setPhotos(Array.from(e.target.files || []))} />
          <button className="btn" type="submit">Create Venue</button>
        </form>
      </div>

      <h3>My Venues</h3>
      <div className="grid grid-3">
        {venues.map(v => (
          <div key={v.id} className="card">
            <div className="body">
              <h4 contentEditable suppressContentEditableWarning onBlur={e => updateField(v.id, "name", e.target.textContent)}>{v.name}</h4>
              <p>{v.address}, {v.city}</p>
              <p>Type: {v.venueType} | Sports: {v.sports?.join(", ")}</p>
              <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
                {v.amenities?.map(a => <span key={a} className="badge">{a}</span>)}
              </div>
              <div className="hr"></div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {v.photos?.map(p => (
                  <div key={p} style={{ position: "relative" }}>
                    <img src={p || "/placeholder.svg"} alt="photo" width="90" height="70" style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <button onClick={() => removePhoto(v.id, p)} className="btn ghost" style={{ position: "absolute", top: 2, right: 2, padding: "2px 6px" }}>x</button>
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <input type="file" multiple accept="image/*" onChange={e => addPhotos(v.id, Array.from(e.target.files || []))} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}