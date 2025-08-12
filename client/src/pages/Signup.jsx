import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "user" })
  const [avatar, setAvatar] = useState(null)
  const [error, setError] = useState("")

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const fd = new FormData()
    fd.append("email", form.email)
    fd.append("password", form.password)
    fd.append("fullName", form.fullName)
    fd.append("role", form.role)
    if (avatar) fd.append("avatar", avatar)
    try {
      const res = await signup(fd)
      localStorage.setItem("pendingEmail", res.email)
      navigate("/verify-otp")
    } catch (e) {
      setError(e.response?.data?.error || "Signup failed")
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h2>Sign Up</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <label>Full Name</label>
          <input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
        </div>
        <div className="form-row">
          <label>Email</label>
          <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div className="form-row">
          <label>Avatar</label>
          <input className="input" type="file" accept="image/*" onChange={e => setAvatar(e.target.files?.[0])} />
        </div>
        <div className="form-row">
          <label>Role</label>
          <select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="user">User</option>
            <option value="facility">Facility Owner</option>
          </select>
        </div>
        <button className="btn" type="submit">Create account</button>
      </form>
      <p style={{ marginTop: 12, color: "#6b7280" }}>Check server console for your OTP code in development.</p>
    </div>
  )
}