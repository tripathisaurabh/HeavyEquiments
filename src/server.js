// backend/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
// import { createBooking } from "../controllers/bookingController.js";  // ✅ plain import
import userRoutes from "./routes/userRoutes.js";

import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";

dotenv.config();
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();
const prisma = new PrismaClient();

// ✅ CORS setup (frontend -> backend)
// import cors from "cors";

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://eqprent-frontend.vercel.app",
      "https://eqprent-frontend-git-main-tripathisaurabh1411-5376s-projects.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);



// ✅ JSON body parser
app.use(express.json());

// ✅ Static Uploads Path (absolute + cross-platform safe)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 The uploads folder path should be inside backend/
const uploadsDir = path.join(__dirname, "../uploads");

console.log("📂 Serving uploads from:", uploadsDir);
app.use("/uploads", express.static(uploadsDir));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/vendors", vendorRoutes);

app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
import transactionRoutes from "./routes/transactionRoutes.js";

// ✅ Root endpoint
app.get("/", (req, res) => {
  res.send("🚜 Heavy Equipment Backend Running...");
});
app.use("/api/payment", paymentRoutes);
app.use("/api/transactions", transactionRoutes);
// ✅ Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
