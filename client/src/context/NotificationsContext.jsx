"use client"
import React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "./AuthContext"
import { io } from "socket.io-client"

const NotificationContext = createContext()

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)

  const { user } = useAuth()

  const addNotification = useCallback((notificationData) => {
    console.log("Adding notification:", notificationData)
    const notification = {
      id: Date.now() + Math.random(),
      type: notificationData.type || "info",
      message: notificationData.message,
      priority: notificationData.priority || "normal",
      timestamp: new Date(notificationData.timestamp || Date.now()),
      isGlobal: notificationData.isGlobal || false,
      read: false,
    }
    setNotifications((prev) => {
      console.log("Current notifications count:", prev.length)
      const newNotifications = [notification, ...prev]
      console.log("New notifications count:", newNotifications.length)
      return newNotifications
    })
  }, [])

  useEffect(() => {
    if (!user?.id || socketRef.current) return

    console.log("Connecting to real socket server for user:", user.id)

    const socketClient = io("http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    })

    socketClient.on("connect", () => {
      console.log("Socket connected:", socketClient.id)
      setIsConnected(true)

      // Join user room for targeted notifications
      socketClient.emit("join:user", { userId: user.id })

      // Add welcome notification
      setTimeout(() => {
        addNotification({
          message: `Welcome ${user.fullName || user.name}! You're now connected to real-time notifications.`,
          type: "success",
          priority: "normal",
          isGlobal: false,
        })
      }, 1000)
    })

    socketClient.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socketClient.on("globalNotification", (data) => {
      console.log("Global notification received:", data)
      addNotification({
        ...data,
        isGlobal: true,
      })
    })

    socketClient.on("notification", (data) => {
      console.log("User notification received:", data)
      addNotification({
        ...data,
        isGlobal: false,
      })
    })

    socketClient.on("userWarning", (data) => {
      console.log("Warning notification received:", data)
      addNotification({
        message: data.message,
        type: "warning",
        priority: "high",
        timestamp: data.timestamp,
        isWarning: true,
      })
    })

    socketClient.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnected(false)
    })

    socketRef.current = socketClient
    setSocket(socketClient)

    return () => {
      console.log("Cleaning up socket connection")
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setSocket(null)
      setIsConnected(false)
    }
  }, [user?.id, addNotification])

  const markAsRead = (notificationId) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)))
  }

  const removeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const sendTestNotification = (message, type = "info", priority = "normal") => {
    console.log("Sending test notification:", message, type, priority)
    addNotification({
      message,
      type,
      priority,
      isGlobal: true,
    })
  }

  const value = {
    notifications,
    socket,
    isConnected,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    sendTestNotification,
    unreadCount: notifications.filter((n) => !n.read).length,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
