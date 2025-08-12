import React, { useState } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const location = useLocation()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    try {
      await login({ email, password })
      const to = location.state?.from?.pathname || "/"
      navigate(to)
    } catch (e) {
      setError(e.response?.data?.error || "Login failed")
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button className="btn" type="submit">Login</button>
      </form>
      <p style={{ marginTop: 10 }}>Don't have an account? <Link to="/signup">Sign up</Link></p>
    </div>
  )
}