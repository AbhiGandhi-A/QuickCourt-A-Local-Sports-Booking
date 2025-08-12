import React, { useEffect, useState } from "react"
import { api } from "../../api/axios"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

export default function AdminDashboard() {
  const [kpis, setKpis] = useState({ totalUsers: 0, totalFacilityOwners: 0, totalBookings: 0, totalActiveCourts: 0 })
  const [bookingActivity, setBookingActivity] = useState([])
  const [userRegs, setUserRegs] = useState([])
  const [approvalTrend, setApprovalTrend] = useState([])
  const [sports, setSports] = useState({ labels: [], values: [] })
  const [earnings, setEarnings] = useState([])

  useEffect(() => {
    api.get("/admin/stats/kpis").then(res => setKpis(res.data))
    api.get("/admin/stats/booking-activity").then(res => setBookingActivity(res.data.data || []))
    api.get("/admin/stats/user-registrations").then(res => setUserRegs(res.data.data || []))
    api.get("/admin/stats/facility-approval-trend").then(res => setApprovalTrend(res.data.data || []))
    api.get("/admin/stats/most-sports").then(res => setSports(res.data))
    api.get("/admin/stats/earnings").then(res => setEarnings(res.data.data || []))
  }, [])

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div className="admin-kpi">
        <div className="card"><div>Total Users</div><h3>{kpis.totalUsers}</h3></div>
        <div className="card"><div>Facility Owners</div><h3>{kpis.totalFacilityOwners}</h3></div>
        <div className="card"><div>Total Bookings</div><h3>{kpis.totalBookings}</h3></div>
        <div className="card"><div>Active Courts</div><h3>{kpis.totalActiveCourts}</h3></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 12 }}>
          <h4>Booking Activity Over Time</h4>
          <Line data={{
            labels: bookingActivity.map(d => String(d._id)),
            datasets: [{ label: "Bookings", data: bookingActivity.map(d => d.count), borderColor: "#111827", backgroundColor: "rgba(17,24,39,0.2)", fill: true }]
          }} options={{ plugins: { legend: { display: false } } }} />
        </div>
        <div className="card" style={{ padding: 12 }}>
          <h4>User Registration Trends</h4>
          <Bar data={{
            labels: userRegs.map(d => String(d._id)),
            datasets: [{ label: "Registrations", data: userRegs.map(d => d.count), backgroundColor: "#16a34a" }]
          }} options={{ plugins: { legend: { display: false } } }} />
        </div>
        <div className="card" style={{ padding: 12 }}>
          <h4>Facility Approval Trend</h4>
          <Line data={{
            labels: approvalTrend.map(d => String(d._id)),
            datasets: [
              { label: "Pending", data: approvalTrend.map(d => d.pending), borderColor: "#f59e0b" },
              { label: "Approved", data: approvalTrend.map(d => d.approved), borderColor: "#16a34a" },
              { label: "Rejected", data: approvalTrend.map(d => d.rejected), borderColor: "#ef4444" }
            ]
          }} />
        </div>
        <div className="card" style={{ padding: 12 }}>
          <h4>Most Active Sports</h4>
          {sports.labels?.length ? (
            <Doughnut data={{
              labels: sports.labels,
              datasets: [{ data: sports.values, backgroundColor: ["#16a34a", "#4ade80", "#86efac", "#bbf7d0", "#34d399", "#a7f3d0"] }]
            }} />
          ) : <p>No data yet.</p>}
        </div>
        <div className="card" style={{ padding: 12 }}>
          <h4>Earnings Simulation</h4>
          <Bar data={{
            labels: earnings.map(e => String(e._id)),
            datasets: [{ label: "Revenue", data: earnings.map(e => e.revenue), backgroundColor: "#111827" }]
          }} />
        </div>
      </div>
    </div>
  )
}