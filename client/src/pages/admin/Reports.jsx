"use client"
import React from "react";

import { useEffect, useState } from "react"
import { api } from "../../api/axios"

export default function AdminReports() {
  const [items, setItems] = useState([])
  const [globalMsg, setGlobalMsg] = useState("")
  const [warnMsg, setWarnMsg] = useState({})
  const [statusMsg, setStatusMsg] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [customStartTime, setCustomStartTime] = useState("")
  const [customEndTime, setCustomEndTime] = useState("")
  const [customDate, setCustomDate] = useState("")

  // Predefined notification templates
  const notificationTemplates = [
    {
      id: "maintenance",
      label: "Scheduled Maintenance",
      template:
        "🔧 Scheduled maintenance from {startTime} to {endTime} on {date}. Services may be temporarily unavailable.",
    },
    {
      id: "system_update",
      label: "System Update",
      template: "🚀 System update scheduled from {startTime} to {endTime} on {date}. New features coming your way!",
    },
    {
      id: "server_downtime",
      label: "Server Downtime",
      template:
        "⚠️ Server maintenance from {startTime} to {endTime} on {date}. Please save your work and log back in later.",
    },
    {
      id: "holiday_hours",
      label: "Holiday Hours",
      template: "🎉 Holiday schedule: Limited services from {startTime} to {endTime} on {date}. Happy holidays!",
    },
    {
      id: "emergency_maintenance",
      label: "Emergency Maintenance",
      template:
        "🚨 Emergency maintenance in progress from {startTime} to {endTime} on {date}. We apologize for any inconvenience.",
    },
    {
      id: "new_feature",
      label: "New Feature Announcement",
      template: "✨ Exciting new features are now live! Check them out and let us know what you think.",
    },
    {
      id: "policy_update",
      label: "Policy Update",
      template: "📋 Our terms and policies have been updated. Please review the changes in your account settings.",
    },
    {
      id: "security_alert",
      label: "Security Alert",
      template: "🔒 Security update completed. Please log out and log back in to ensure your account is secure.",
    },
  ]

  const load = async () => {
    try {
      const res = await api.get("/admin/reports")
      setItems(res.data.data || [])
    } catch (error) {
      console.error("Failed to load reports:", error)
      setStatusMsg("Failed to load reports")
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resolve = async (id) => {
    try {
      await api.patch(`/admin/reports/${id}/resolve`)
      setStatusMsg("Report resolved successfully")
      load()
    } catch (error) {
      setStatusMsg("Failed to resolve report")
    }
  }

  const dismiss = async (id) => {
    try {
      await api.patch(`/admin/reports/${id}/dismiss`)
      setStatusMsg("Report dismissed successfully")
      load()
    } catch (error) {
      setStatusMsg("Failed to dismiss report")
    }
  }

  // Send warning to user of a specific report
  const sendWarning = async (userId) => {
    if (!warnMsg[userId] || warnMsg[userId].trim() === "") {
      alert("Please enter a warning message")
      return
    }
    try {
      await api.post("/admin/notify-warning", {
        userId,
        message: warnMsg[userId],
      })
      setStatusMsg(`Warning sent to user ${userId}`)
      setWarnMsg((prev) => ({ ...prev, [userId]: "" }))
    } catch (err) {
      console.error("Failed to send warning:", err)
      setStatusMsg("Failed to send warning - API endpoint not available")
    }
  }

  // Handle template selection
  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId)
    const template = notificationTemplates.find((t) => t.id === templateId)
    if (template) {
      let message = template.template

      // Replace placeholders if time/date values are provided
      if (customStartTime) {
        message = message.replace("{startTime}", customStartTime)
      }
      if (customEndTime) {
        message = message.replace("{endTime}", customEndTime)
      }
      if (customDate) {
        message = message.replace("{date}", new Date(customDate).toLocaleDateString())
      }

      setGlobalMsg(message)
    }
  }

  // Update message when time/date changes
  useEffect(() => {
    if (selectedTemplate) {
      handleTemplateChange(selectedTemplate)
    }
  }, [customStartTime, customEndTime, customDate])

  // Send global alert notification to all users
  const sendGlobalAlert = async () => {
    if (globalMsg.trim() === "") {
      alert("Please enter a global alert message")
      return
    }
    try {
      await api.post("/admin/notify-all", {
        message: globalMsg,
        type: "alert",
        priority: selectedTemplate === "emergency_maintenance" ? "high" : "normal",
      })
      setStatusMsg("Global alert sent to all users successfully")
      setGlobalMsg("")
      setSelectedTemplate("")
      setCustomStartTime("")
      setCustomEndTime("")
      setCustomDate("")
    } catch (err) {
      console.error("Failed to send global alert:", err)
      if (err.response?.status === 404) {
        setStatusMsg("Notification API not available. Message saved locally for development.")
        console.log("Global notification would be sent:", {
          message: globalMsg,
          type: "alert",
          priority: selectedTemplate === "emergency_maintenance" ? "high" : "normal",
          timestamp: new Date().toISOString(),
        })
        // Clear form on simulated success
        setGlobalMsg("")
        setSelectedTemplate("")
        setCustomStartTime("")
        setCustomEndTime("")
        setCustomDate("")
      } else {
        setStatusMsg("Failed to send global alert. Please check server connection.")
      }
    }
  }

  return (
    <div className="admin-reports">
      <h2>Reports & Moderation</h2>

      {statusMsg && (
        <div className={`status-message ${statusMsg.includes("Failed") ? "error" : "success"}`}>
          {statusMsg}
          <button onClick={() => setStatusMsg("")} className="close-btn">
            ×
          </button>
        </div>
      )}

      <div className="reports-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Target</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan="6" className="no-data">
                  No reports found.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="report-type-badge">{r.targetType}</span>
                </td>
                <td className="target-id">{r.targetId}</td>
                <td className="reason-text">{r.reason}</td>
                <td>
                  <span className={`status-badge ${r.status}`}>{r.status}</span>
                </td>
                <td className="date-text">{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  <div className="action-buttons">
                    {r.status === "open" && (
                      <>
                        <button className="btn btn-success" onClick={() => resolve(r.id)}>
                          Resolve
                        </button>
                        <button className="btn btn-secondary" onClick={() => dismiss(r.id)}>
                          Dismiss
                        </button>
                        <div className="warning-section">
                          <input
                            type="text"
                            className="warning-input"
                            placeholder="Warning message..."
                            value={warnMsg[r.userId] || ""}
                            onChange={(e) => setWarnMsg((prev) => ({ ...prev, [r.userId]: e.target.value }))}
                          />
                          <button
                            className="btn btn-warning"
                            onClick={() => sendWarning(r.userId)}
                            disabled={!warnMsg[r.userId] || warnMsg[r.userId].trim() === ""}
                          >
                            Send Warning
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="global-notifications-section">
        <h3>Global Notifications</h3>

        <div className="notification-templates">
          <div className="template-selector">
            <label htmlFor="template-select">Choose Template:</label>
            <select
              id="template-select"
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="template-dropdown"
            >
              <option value="">Custom Message</option>
              {notificationTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate &&
            (selectedTemplate === "maintenance" ||
              selectedTemplate === "system_update" ||
              selectedTemplate === "server_downtime" ||
              selectedTemplate === "holiday_hours" ||
              selectedTemplate === "emergency_maintenance") && (
              <div className="time-date-inputs">
                <div className="input-group">
                  <label htmlFor="custom-date">Date:</label>
                  <input
                    id="custom-date"
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="date-input"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="start-time">Start Time:</label>
                  <input
                    id="start-time"
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="time-input"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="end-time">End Time:</label>
                  <input
                    id="end-time"
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="time-input"
                  />
                </div>
              </div>
            )}
        </div>

        <div className="message-composer">
          <label htmlFor="global-message">Notification Message:</label>
          <textarea
            id="global-message"
            rows={4}
            placeholder="Enter your notification message here..."
            value={globalMsg}
            onChange={(e) => setGlobalMsg(e.target.value)}
            className="global-message-textarea"
          />
          <div className="message-actions">
            <button className="btn btn-primary btn-lg" onClick={sendGlobalAlert} disabled={globalMsg.trim() === ""}>
              Send Global Notification
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setGlobalMsg("")
                setSelectedTemplate("")
                setCustomStartTime("")
                setCustomEndTime("")
                setCustomDate("")
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
