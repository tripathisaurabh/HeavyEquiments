import express from "express";
import {
  createBooking,
  getBookingsByVendor,
  getUserBookings,
  updateBookingStatus,
  getUnavailableDates,
  updateUserBooking,
  cancelUserBooking
} from "../controllers/bookingController.js";
import { PrismaClient } from "@prisma/client";
import { checkBookingAvailability } from "../controllers/bookingController.js";

const prisma = new PrismaClient();

const router = express.Router();

// ✅ Core routes
router.post("/", createBooking);
router.get("/vendor/:vendorId", getBookingsByVendor);
router.get("/user/:userId", getUserBookings);
router.put("/:id", updateBookingStatus);

// ✅ Calendar
router.get("/unavailable/:equipmentId", getUnavailableDates);

// ✅ User booking management
router.put("/user/update/:id", updateUserBooking);
router.put("/user/cancel/:id", cancelUserBooking);
router.get("/check-availability", checkBookingAvailability);

// ==============================
// 📍 POST /api/bookings/track
// ==============================
router.post("/track", async (req, res) => {
  try {
    const { refId, last4 } = req.body;

    if (!refId || !last4) {
      return res.status(400).json({ success: false, message: "Missing details" });
    }

    // Find booking by reference ID
    const booking = await prisma.booking.findUnique({
      where: { referenceId: refId },
      include: {
        equipment: { select: { name: true } },
        events: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Verify last 4 digits of phone
    const user = await prisma.user.findUnique({ where: { id: booking.userId } });
    if (!user || !user.phone.endsWith(last4)) {
      return res.status(403).json({ success: false, message: "Verification failed" });
    }

    // Prepare response
    const response = {
      refId: booking.referenceId,
      name: booking.name,
      equipment: booking.equipment?.name,
      status: booking.status,
      pickupDate: booking.pickupDate,
      dropDate: booking.dropDate,
      updatedAt: booking.updatedAt,
      lastEvent: booking.events?.[0]?.note || null,
    };

    // 🧾 If cancelled — include cancelled time
    if (booking.status === "CANCELLED") {
      response.cancelledAt = booking.updatedAt;
      response.cancelledMsg = "This booking has been cancelled.";
    }

    return res.json({ success: true, ...response });
  } catch (err) {
    console.error("❌ Tracking error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


export default router;
