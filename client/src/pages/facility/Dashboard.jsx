import React, { useEffect, useState } from "react"
import { api } from "../../api/axios"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from "chart.js"
import dayjs from "dayjs"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

export default function FacilityDashboard() {
  const [kpis, setKpis] = useState({ totalBookings: 0, activeCourts: 0, earnings: 0 })
  const [trend, setTrend] = useState([])
  const [earnings, setEarnings] = useState({ labels: [], values: [] })
  const [peak, setPeak] = useState({ hours: [], values: [] })
  const [calendar, setCalendar] = useState([])

  const now = dayjs()
  const year = now.year()
  const month = now.month() + 1

  useEffect(() => {
    api.get("/facility/stats/kpis").then(res => setKpis(res.data))
    api.get("/facility/stats/trends", { params: { period: "daily", limit: 14 } }).then(res => setTrend(res.data.data))
    api.get("/facility/stats/earnings").then(res => setEarnings(res.data))
    api.get("/facility/stats/peak-hours").then(res => setPeak(res.data))
    api.get("/facility/stats/calendar", { params: { year, month } }).then(res => setCalendar(res.data.data || []))
  }, [])

  // Calendar prep
  const start = dayjs(`${year}-${String(month).padStart(2, "0")}-01`)
  const end = start.endOf("month")
  const firstWeekday = start.day() // 0 Sunday
  const daysInMonth = end.date()
  const countsMap = new Map(calendar.map(d => [d._id, d.count]))
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, count: countsMap.get(`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`) || 0 })

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome back! Here are your KPIs.</p>
      <div className="kpi">
        <div className="card">
          <div>Total Bookings</div>
          <h3>{kpis.totalBookings}</h3>
        </div>
        <div className="card">
          <div>Active Courts</div>
          <h3>{kpis.activeCourts}</h3>
        </div>
        <div className="card">
          <div>Earnings (simulated)</div>
          <h3>${kpis.earnings}</h3>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 12 }}>
          <h4>Daily Booking Trends</h4>
          <Line
            data={{
              labels: trend.map(t => String(t._id)),
              datasets: [{ label: "Bookings", data: trend.map(t => t.count), borderColor: "#16a34a", backgroundColor: "rgba(22,163,74,0.2)", fill: true }]
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>
        <div className="card" style={{ padding: 12 }}>
          <h4>Earnings by Venue</h4>
          {earnings.labels.length ? (
            <Doughnut
              data={{
                labels: earnings.labels,
                datasets: [{ data: earnings.values, backgroundColor: ["#16a34a", "#4ade80", "#86efac", "#bbf7d0", "#34d399"] }]
              }}
            />
          ) : <p>No earnings yet.</p>}
        </div>
        <div className="card" style={{ padding: 12 }}>
          <h4>Peak Booking Hours</h4>
          <Bar
            data={{
              labels: peak.hours.map(h => `${String(h).padStart(2, "0")}:00`),
              datasets: [{ label: "Bookings", data: peak.values, backgroundColor: "#16a34a" }]
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>
        <div className="card" style={{ padding: 12 }}>
          <h4>Booking Calendar ({now.format("MMMM YYYY")})</h4>
          <div className="calendar-grid">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} style={{ fontWeight: "bold", textAlign: "center" }}>{d}</div>)}
            {cells.map((c, idx) => (
              <div key={idx} className="calendar-cell" style={{ background: c && c.count ? "#ecfdf5" : "#fff" }}>
                <div style={{ textAlign: "right" }}>{c?.day || ""}</div>
                {c && c.count ? <div className="count">{c.count} booking{c.count>1?"s":""}</div> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}