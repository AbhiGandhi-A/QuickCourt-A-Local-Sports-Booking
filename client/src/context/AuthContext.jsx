import React, { createContext, useContext, useEffect, useState } from "react"
import { api } from "../api/axios"
import { io } from "socket.io-client"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    api.get("/auth/me").then((res) => {
      setUser(res.data.user)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user && !socket) {
      const s = io("http://localhost:5000", { withCredentials: true })
      s.on("connect", () => {
        s.emit("join:user", { userId: user.id })
      })
      setSocket(s)
      return () => { s.disconnect() }
    }
  }, [user])

  const login = async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password })
    setUser(res.data.user)
  }

  const logout = async () => {
    await api.post("/auth/logout")
    setUser(null)
  }

  const signup = async (formData) => {
    const res = await api.post("/auth/signup", formData, { headers: { "Content-Type": "multipart/form-data" } })
    return res.data
  }

  const verifyOtp = async ({ email, otp }) => {
    const res = await api.post("/auth/verify-otp", { email, otp })
    return res.data
  }

  const updateMe = async (formData) => {
    const res = await api.put("/users/me", formData, { headers: { "Content-Type": "multipart/form-data" } })
    setUser(res.data.user)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, verifyOtp, updateMe, socket }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}