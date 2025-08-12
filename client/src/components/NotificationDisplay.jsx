"use client"
import React from "react"
import { useState } from "react"
import { useNotifications } from "../context/NotificationContext"

export default function NotificationDisplay() {
  const { notifications, markAsRead, removeNotification, clearAllNotifications, unreadCount, isConnected } =
    useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type) => {
    switch (type) {
      case "warning":
        return "⚠️"
      case "alert":
        return "🚨"
      case "success":
        return "✅"
      case "info":
        return "ℹ️"
      default:
        return "📢"
    }
  }

  const getNotificationColor = (type, priority) => {
    if (type === "warning" || priority === "high") return "#ef4444"
    if (type === "success") return "#10b981"
    if (type === "alert") return "#f59e0b"
    return "#3b82f6"
  }

  return (
    <>
      {/*  Added notification banner for unread notifications */}
      {unreadCount > 0 && !isOpen && (
        <div className="notification-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "18px" }}>🔔</span>
            <span style={{ fontWeight: "500" }}>
              You have {unreadCount} new notification{unreadCount > 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="notification-banner-button"
          >
            View All
          </button>
        </div>
      )}

      <div className="notification-container">
        {/*  Updated connection status to use CSS classes */}
        <div
          className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
          title={isConnected ? "Connected" : "Disconnected"}
        />

        {/*  Updated notification bell to use CSS classes with proper animations */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
        >
          🔔
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/*  Updated notification panel styling */}
        {isOpen && (
          <div className="notification-panel">
            {/* Header */}
            <div className="notification-header">
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Notifications ({notifications.length})</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="clear-all-button"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="empty-notifications">
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* Priority Indicator */}
                    {notification.priority === "high" && (
                      <div className="priority-indicator" />
                    )}

                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div
                        style={{
                          fontSize: "20px",
                          color: getNotificationColor(notification.type, notification.priority),
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "14px",
                            lineHeight: "1.4",
                            color: "#1f2937",
                            fontWeight: notification.read ? "normal" : "500",
                          }}
                        >
                          {notification.message}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            {notification.timestamp.toLocaleTimeString()}
                          </span>

                          <div style={{ display: "flex", gap: "8px" }}>
                            {notification.isGlobal && (
                              <span className="notification-tag global">
                                Global
                              </span>
                            )}

                            {notification.isWarning && (
                              <span className="notification-tag warning">
                                Warning
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(notification.id)
                        }}
                        className="remove-notification-button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
