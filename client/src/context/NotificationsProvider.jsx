import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext"; // assuming you have this hook to get user info

const NotificationsContext = createContext();

export function useNotifications() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }) {
  const { user } = useAuth(); // your logged-in user object
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?._id) return;

    const socketClient = io("http://localhost:5000", {
      withCredentials: true,
    });

    socketClient.on("connect", () => {
      console.log("Socket connected:", socketClient.id);
      socketClient.emit("join:user", { userId: user._id });
    });

    socketClient.on("notification", (data) => {
      console.log("Notification received:", data);
      setNotifications((prev) => [data, ...prev]);
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [user]);

  return (
    <NotificationsContext.Provider value={{ notifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}
