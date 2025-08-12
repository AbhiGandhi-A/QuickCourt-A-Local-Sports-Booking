import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function VerifyOtp() {
  const { verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(localStorage.getItem("pendingEmail") || "")
  const [otp, setOtp] = useState("")
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(""); setMsg("")
    try {
      const res = await verifyOtp({ email, otp })
      setMsg(res.message || "Verified")
      localStorage.removeItem("pendingEmail")
      setTimeout(() => navigate("/login"), 800)
    } catch (e) {
      setError(e.response?.data?.error || "Verification failed")
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2>Verify OTP</h2>
      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>OTP</label>
          <input className="input" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" required />
        </div>
        <button className="btn" type="submit">Verify</button>
      </form>
    </div>
  )
}