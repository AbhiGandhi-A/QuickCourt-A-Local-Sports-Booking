import React from "react"

// Replace with your backend base URL or use env variables accordingly
const BACKEND_URL = "http://localhost:5000"

export default function Avatar({ user, size = 64, className = "" }) {
  const getInitials = (name) => {
    if (!name) return "?"
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  if (user.avatarUrl) {
    // If avatarUrl is relative, prepend backend URL
    const src = user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : BACKEND_URL + user.avatarUrl

    return (
      <img
        src={src}
        alt="avatar"
        className={`avatar ${className}`}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
      />
    )
  }

  // Fallback: show initials
  return (
    <div
      className={`avatar-initials ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#007bff",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontWeight: "bold",
        fontSize: size / 2,
        userSelect: "none",
      }}
    >
      {getInitials(user.fullName)}
    </div>
  )
}
