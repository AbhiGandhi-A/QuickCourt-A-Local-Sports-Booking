import React, { useEffect, useState } from "react"
import { api } from "../../api/axios"

export default function AdminUsers() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")
  const [history, setHistory] = useState([])

  const load = async () => {
    const res = await api.get("/admin/users", { params: { q: q || undefined, role: role || undefined, status: status || undefined } })
    setItems(res.data.data || [])
    setHistory([])
  }

  useEffect(() => { load() }, []) // initial

  const ban = async (id) => { await api.patch(`/admin/users/${id}/ban`); load() }
  const unban = async (id) => { await api.patch(`/admin/users/${id}/unban`); load() }
  const bookingHistory = async (id) => {
    const res = await api.get(`/admin/users/${id}/bookings`)
    setHistory(res.data.data || [])
  }

  return (
    <div>
      <h2>User Management</h2>
      <form onSubmit={e => { e.preventDefault(); load() }} className="search-row">
        <input className="input" placeholder="Search name or email" value={q} onChange={e => setQ(e.target.value)} />
        <select className="select" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">Role</option>
          <option value="user">User</option>
          <option value="facility">Facility</option>
          <option value="admin">Admin</option>
        </select>
        <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <button className="btn" type="submit">Filter</button>
      </form>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 16, marginTop: 12 }}>
        <div>
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {items.map(u => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.status}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="row" style={{ gap: 6 }}>
                    <button className="btn ghost" onClick={() => bookingHistory(u.id)}>History</button>
                    {u.status === "active" ? (
                      <button className="btn ghost" onClick={() => ban(u.id)}>Ban</button>
                    ) : (
                      <button className="btn ghost" onClick={() => unban(u.id)}>Unban</button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="6">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
        <br />
        <div className="card" >
          <h4>Booking History</h4>
          <table className="table">
            <thead><tr><th>Venue</th><th>Court</th><th>Sport</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td>{h.venueName}</td>
                  <td>{h.courtName}</td>
                  <td>{h.sportType}</td>
                  <td>{h.date}</td>
                  <td>{h.time}</td>
                  <td>{h.status}</td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan="6">Select a user to view history.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}