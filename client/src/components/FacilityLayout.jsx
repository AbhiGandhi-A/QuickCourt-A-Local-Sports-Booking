import React from "react"
import { NavLink, Outlet } from "react-router-dom"

export default function FacilityLayout() {
  return (
    <div className="fac-layout container" style={{ maxWidth: "1200px" }}>
      <aside className="fac-sidebar">
        <h3>Facility</h3>
        <NavLink to="/facility/dashboard" className={({ isActive }) => isActive ? "active-link" : undefined}>Dashboard</NavLink>
        <NavLink to="/facility/venues" className={({ isActive }) => isActive ? "active-link" : undefined}>Venues</NavLink>
        <NavLink to="/facility/courts" className={({ isActive }) => isActive ? "active-link" : undefined}>Courts</NavLink>
        <NavLink to="/facility/slots" className={({ isActive }) => isActive ? "active-link" : undefined}>Time Slots</NavLink>
        <NavLink to="/facility/bookings" className={({ isActive }) => isActive ? "active-link" : undefined}>Bookings</NavLink>
        <NavLink to="/facility/profile" className={({ isActive }) => isActive ? "active-link" : undefined}>Profile</NavLink>
      </aside>
      <section className="fac-content">
        <Outlet />
      </section>
    </div>
  )
}