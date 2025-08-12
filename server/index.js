// server.js (or app.js)
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import userRoutes from "./src/routes/users.js";
import venueRoutes from "./src/routes/venues.js";
import bookingRoutes from "./src/routes/bookings.js";
import facilityRoutes from "./src/routes/facility.js";
import createAdminRouter from "./src/routes/admin.js"; // factory function that takes io
import notificationRoutes from "./src/routes/notifications.js"; // your notifications routes
import { initSocket } from "./socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/facility", facilityRoutes);
app.use("/api/notifications", notificationRoutes); // notification routes

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  },
});

initSocket(io);

app.set("io", io);

app.use("/api/admin", createAdminRouter(io));

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI).then(() => {
  server.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
});
