import React from "react"
import { NavLink, Outlet } from "react-router-dom"

export default function AdminLayout() {
  return (
    <div className="admin-layout container" style={{ maxWidth: "1200px" }}>
      <aside className="admin-sidebar">
        <h3>Admin</h3>
        <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "active-link" : undefined}>Dashboard</NavLink>
        <NavLink to="/admin/approvals" className={({ isActive }) => isActive ? "active-link" : undefined}>Facility Approval</NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? "active-link" : undefined}>Users</NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => isActive ? "active-link" : undefined}>Reports</NavLink>
        <NavLink to="/admin/profile" className={({ isActive }) => isActive ? "active-link" : undefined}>Profile</NavLink>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  )
}