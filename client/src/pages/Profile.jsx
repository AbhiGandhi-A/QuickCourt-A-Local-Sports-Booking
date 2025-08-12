import React, { useState } from "react"
import { useAuth } from "../context/AuthContext"
import Avatar from "../components/Avatar"  // import the new Avatar component

export default function Profile() {
  const { user, updateMe } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || "")
  const [avatar, setAvatar] = useState(null)
  const [msg, setMsg] = useState("")

  if (!user) return <div className="container">Loading...</div>

  const save = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    if (fullName && fullName !== user.fullName) fd.append("fullName", fullName)
    if (avatar) fd.append("avatar", avatar)
    await updateMe(fd)
    setMsg("Profile updated")
    setAvatar(null)
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h2>Profile</h2>
      {msg && <p style={{ color: "green" }}>{msg}</p>}
      <form onSubmit={save}>
        <div className="row" style={{ gap: 16, alignItems: "center" }}>
          <Avatar user={user} size={64} />
          <div style={{ flexGrow: 1 }}>
            <div className="form-row">
              <label>Full Name</label>
              <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Avatar</label>
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={e => setAvatar(e.target.files?.[0])}
              />
            </div>
            <button className="btn" type="submit">Save</button>
          </div>
        </div>
        <div className="hr"></div>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </form>
    </div>
  )
}
