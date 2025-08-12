"use client"
import React from "react"
import { useState, useEffect } from "react"
import { useNotifications } from "../../context/NotificationsContext"

export default function AdminNotifications() {
  const [globalMsg, setGlobalMsg] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [customStartTime, setCustomStartTime] = useState("")
  const [customEndTime, setCustomEndTime] = useState("")
  const [customDate, setCustomDate] = useState("")
  const [statusMsg, setStatusMsg] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [notificationType, setNotificationType] = useState("")
  const [priority, setPriority] = useState("")

  const { sendTestNotification } = useNotifications()

  const API_BASE_URL = "http://localhost:5000"

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
      id: "security_alert",
      label: "Security Alert",
      template: "🔒 Security update completed. Please log out and log back in to ensure your account is secure.",
    },
  ]

  useEffect(() => {
    if (selectedTemplate) {
      handleTemplateChange(selectedTemplate)
    }
  }, [customStartTime, customEndTime, customDate])

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId)
    const template = notificationTemplates.find((t) => t.id === templateId)
    if (template) {
      let message = template.template
      if (customStartTime) message = message.replace("{startTime}", customStartTime)
      if (customEndTime) message = message.replace("{endTime}", customEndTime)
      if (customDate) message = message.replace("{date}", new Date(customDate).toLocaleDateString())
      setGlobalMsg(message)

      const type =
        templateId === "emergency_maintenance"
          ? "alert"
          : templateId === "security_alert"
            ? "warning"
            : templateId === "new_feature"
              ? "success"
              : "info"

      const prio = templateId === "emergency_maintenance" ? "high" : "normal"

      setNotificationType(type)
      setPriority(prio)
    }
  }

  const sendGlobalNotification = async () => {
    if (globalMsg.trim() === "") {
      alert("Please enter a notification message")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/notify-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: globalMsg,
          type: notificationType,
          priority: priority,
        }),
      })

      if (response.ok) {
        setStatusMsg("✅ Global notification sent successfully to all users!")
      } else {
        throw new Error("Failed to send notification")
      }

      // Clear form
      setGlobalMsg("")
      setSelectedTemplate("")
      setCustomStartTime("")
      setCustomEndTime("")
      setCustomDate("")

      // Clear status message after 5 seconds
      setTimeout(() => setStatusMsg(""), 5000)
    } catch (error) {
      console.error("Failed to send notification:", error)

      sendTestNotification(globalMsg, notificationType, priority)
      setStatusMsg("⚠️ API unavailable - notification sent locally for testing")

      setTimeout(() => setStatusMsg(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const sendQuickTest = async (type) => {
    const messages = {
      info: "📢 This is a test information notification",
      success: "✅ Test successful! Everything is working perfectly",
      warning: "⚠️ This is a test warning notification",
      alert: "🚨 This is a test alert notification",
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/notify-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: messages[type],
          type: type,
          priority: type === "alert" || type === "warning" ? "high" : "normal",
        }),
      })

      if (!response.ok) {
        throw new Error("API unavailable")
      }
    } catch (error) {
      // Fallback to local notification
      sendTestNotification(messages[type], type, type === "alert" || type === "warning" ? "high" : "normal")
    }

    setStatusMsg(`✅ Test ${type} notification sent!`)
    setTimeout(() => setStatusMsg(""), 3000)
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ marginBottom: "30px", color: "#1f2937" }}>Admin Notifications</h2>

      {statusMsg && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            backgroundColor: statusMsg.includes("❌") ? "#fee2e2" : "#d1fae5",
            color: statusMsg.includes("❌") ? "#991b1b" : "#065f46",
            borderRadius: "8px",
            border: `1px solid ${statusMsg.includes("❌") ? "#fca5a5" : "#a7f3d0"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {statusMsg}
          <button
            onClick={() => setStatusMsg("")}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            ×
          </button>
        </div>
      )}

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginBottom: "16px", color: "#374151" }}>Quick Test Notifications</h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => sendQuickTest("info")}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            📢 Info
          </button>
          <button
            onClick={() => sendQuickTest("success")}
            style={{
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            ✅ Success
          </button>
          <button
            onClick={() => sendQuickTest("warning")}
            style={{
              backgroundColor: "#f59e0b",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            ⚠️ Warning
          </button>
          <button
            onClick={() => sendQuickTest("alert")}
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            🚨 Alert
          </button>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h3 style={{ marginBottom: "20px", color: "#374151" }}>Send Custom Global Notification</h3>

        {/* Template Selector */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
            Choose Template:
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "white",
            }}
          >
            <option value="">Custom Message</option>
            {notificationTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time/Date Inputs for maintenance templates */}
        {selectedTemplate && (selectedTemplate.includes("maintenance") || selectedTemplate === "system_update") && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "16px",
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div>
              <label
                style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "500", color: "#6b7280" }}
              >
                Date:
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "500", color: "#6b7280" }}
              >
                Start Time:
              </label>
              <input
                type="time"
                value={customStartTime}
                onChange={(e) => setCustomStartTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "500", color: "#6b7280" }}
              >
                End Time:
              </label>
              <input
                type="time"
                value={customEndTime}
                onChange={(e) => setCustomEndTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
        )}

        {/* Message Textarea */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
            Notification Message:
          </label>
          <textarea
            rows={4}
            placeholder="Enter your notification message here..."
            value={globalMsg}
            onChange={(e) => setGlobalMsg(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={sendGlobalNotification}
            disabled={globalMsg.trim() === "" || isLoading}
            style={{
              backgroundColor: globalMsg.trim() === "" || isLoading ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: globalMsg.trim() === "" || isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isLoading && (
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid transparent",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
            {isLoading ? "Sending..." : "Send Global Notification"}
          </button>

          <button
            onClick={() => {
              setGlobalMsg("")
              setSelectedTemplate("")
              setCustomStartTime("")
              setCustomEndTime("")
              setCustomDate("")
            }}
            style={{
              backgroundColor: "white",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              padding: "12px 24px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
