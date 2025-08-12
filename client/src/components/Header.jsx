import React from "react"
import { NavLink, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Avatar from "../components/Avatar"  // import Avatar here too

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <nav className="nav container">
        <Link to="/" className="row" style={{ gap: 8 }}>
          <img src="/logo.png" alt="logo" width="28" height="28" />
          <strong>QuickCourt</strong>
        </Link>
        {!!user && <NavLink to="/Home" className={({ isActive }) => isActive ? "active-link" : undefined}>My Home</NavLink>}
        <NavLink to="/venues" className={({ isActive }) => isActive ? "active-link" : undefined}>Venues</NavLink>
        {!!user && <NavLink to="/bookings" className={({ isActive }) => isActive ? "active-link" : undefined}>My Bookings</NavLink>}
        {!!user && <NavLink to="/profile" className={({ isActive }) => isActive ? "active-link" : undefined}>Profile</NavLink>}
        {user?.role === "facility" && <NavLink to="/facility/dashboard" className={({ isActive }) => isActive ? "active-link" : undefined}>Facility</NavLink>}
        {user?.role === "admin" && <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "active-link" : undefined}>Admin</NavLink>}
        <div className="nav-right">
          {!user && <>
            <Link to="/login" className="btn ghost">Login</Link>
            <Link to="/signup" className="btn">Sign Up</Link>
          </>}
          {!!user && (
            <>
              <Avatar user={user} size={32} />
              <span>{user.fullName}</span>
              <button className="btn ghost" onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

