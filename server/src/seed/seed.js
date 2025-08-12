// Load environment variables
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" }); // adjust if your .env is elsewhere

import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { Venue } from "../models/Venue.js";
import { User } from "../models/User.js";

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("❌ MongoDB URI not found in environment variables.");
    process.exit(1);
  }

  await connectDB(mongoUri);

  console.log("🗑 Clearing existing data...");
  await Venue.deleteMany({});
  await User.deleteMany({});

  console.log("👤 Creating users...");
  const admin = await User.create({
    email: "admin@example.com",
    passwordHash: await bcrypt.hash("admin123", 10),
    fullName: "Administrator",
    role: "admin",
    isVerified: true,
    status: "active"
  });

  const owner = await User.create({
    email: "owner@example.com",
    passwordHash: await bcrypt.hash("secret123", 10),
    fullName: "Facility Owner",
    role: "facility",
    isVerified: true,
    status: "active",
    avatarUrl: ""
  });

  await User.create({
    email: "user@example.com",
    passwordHash: await bcrypt.hash("user12345", 10),
    fullName: "Sports User",
    role: "user",
    isVerified: true,
    status: "active"
  });

  console.log("🏟 Creating venues...");
  await Venue.insertMany([
    {
      ownerId: owner._id,
      name: "Riverside Sports Complex",
      description: "Modern complex with multiple indoor and outdoor courts.",
      address: "123 Riverside Rd",
      city: "Springfield",
      locationShort: "Riverside",
      venueType: "mixed",
      sports: ["badminton", "football", "tennis", "table-tennis"],
      amenities: ["Parking", "Showers", "Lockers"],
      photos: [],
      ratingAverage: 4.6,
      approved: true,
      approvalStatus: "approved",
      approvalComment: "",
      courts: [
        { name: "Badminton Court 1", sportType: "badminton", pricePerHour: 12, operatingHours: { open: "07:00", close: "22:00" } },
        { name: "Tennis Court 1", sportType: "tennis", pricePerHour: 18, operatingHours: { open: "06:00", close: "23:00" } },
        { name: "Table Tennis 1", sportType: "table-tennis", pricePerHour: 8, operatingHours: { open: "09:00", close: "21:00" } }
      ]
    },
    {
      ownerId: owner._id,
      name: "City Turf Arena",
      description: "Premium turf for 5-a-side football.",
      address: "456 Downtown St",
      city: "Springfield",
      locationShort: "Downtown",
      venueType: "outdoor",
      sports: ["football"],
      amenities: ["Lights", "Drinking Water"],
      photos: [],
      ratingAverage: 4.4,
      approved: true,
      approvalStatus: "approved",
      approvalComment: "",
      courts: [
        { name: "Turf A", sportType: "football", pricePerHour: 30, operatingHours: { open: "08:00", close: "23:00" } },
        { name: "Turf B", sportType: "football", pricePerHour: 28, operatingHours: { open: "08:00", close: "23:00" } }
      ]
    },
    {
      ownerId: owner._id,
      name: "Pending Sports Hub",
      description: "Awaiting approval.",
      address: "999 Pending Way",
      city: "Shelbyville",
      locationShort: "Uptown",
      venueType: "indoor",
      sports: ["tennis", "table-tennis"],
      amenities: ["Parking"],
      photos: [],
      ratingAverage: 0,
      approved: false,
      approvalStatus: "pending",
      approvalComment: "",
      courts: [
        { name: "Indoor Tennis 1", sportType: "tennis", pricePerHour: 20, operatingHours: { open: "07:00", close: "21:00" } }
      ]
    }
  ]);

  console.log("✅ Seeding completed!");
  console.log("Admin: admin@example.com / admin123");
  console.log("Owner: owner@example.com / secret123");
  console.log("User:  user@example.com / user12345");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
