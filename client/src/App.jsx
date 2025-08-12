import React from "react"
import { Route, Routes } from "react-router-dom"
import Header from "./components/Header"
import { AuthProvider } from "./context/AuthContext"
import { NotificationProvider } from "./context/NotificationsContext" // import your Notification provider

import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import VerifyOtp from "./pages/VerifyOtp"
import Venues from "./pages/venues"
import VenueDetails from "./pages/venueDetails"
import BookCourt from "./pages/BookCourt"
import MyBookings from "./pages/MyBookings"
import Profile from "./pages/Profile"
import ProtectedRoute from "./components/ProtectedRoute"
import RoleRoute from "./components/RoleRoute"
import FacilityLayout from "./components/FacilityLayout"
import FacilityDashboard from "./pages/facility/Dashboard"
import FacilityVenues from "./pages/facility/Venues"
import FacilityCourts from "./pages/facility/Courts"
import FacilitySlots from "./pages/facility/Slots"
import FacilityBookings from "./pages/facility/Bookings"
import FacilityProfile from "./pages/facility/Profile"
import AdminLayout from "./components/AdminLayout"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminApprovals from "./pages/admin/Approvals"
import AdminUsers from "./pages/admin/Users"
import AdminReports from "./pages/admin/Reports"
import AdminProfile from "./pages/admin/Profile"
import Page from "./pages/Page"

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>  {/* Wrap with NotificationProvider here */}
        <Header />
        <Routes>
          <Route path="/" element={<Page />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/venues/:id" element={<VenueDetails />} />
          <Route path="/book/:venueId" element={<ProtectedRoute><BookCourt /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          <Route path="/facility" element={<RoleRoute role="facility"><FacilityLayout /></RoleRoute>}>
            <Route path="dashboard" element={<FacilityDashboard />} />
            <Route path="venues" element={<FacilityVenues />} />
            <Route path="courts" element={<FacilityCourts />} />
            <Route path="slots" element={<FacilitySlots />} />
            <Route path="bookings" element={<FacilityBookings />} />
            <Route path="profile" element={<FacilityProfile />} />
          </Route>

          <Route path="/admin" element={<RoleRoute role="admin"><AdminLayout /></RoleRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  )
}
