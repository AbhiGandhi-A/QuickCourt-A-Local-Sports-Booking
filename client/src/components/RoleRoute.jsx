import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function RoleRoute({ role, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="container">Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}