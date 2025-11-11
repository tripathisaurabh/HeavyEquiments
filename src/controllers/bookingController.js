import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* =====================================================
   🟢 CREATE BOOKING (User Side)
   ===================================================== */
export const createBooking = async (req, res) => {
  try {
    const {
      name,
      pickupDate,
      dropDate,
      address,
      equipmentId,
      travelCost,
      totalCost,
      paymentMethod,
      userId,
    } = req.body;

    if (!equipmentId || !pickupDate || !dropDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking details.",
      });
    }

    // ✅ Get equipment details
    const equipment = await prisma.equipment.findUnique({
      where: { id: Number(equipmentId) },
      select: { id: true, vendorId: true, price: true, quantity: true },
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    // ✅ Check if equipment already fully booked for the date range
    const overlapping = await prisma.booking.findMany({
      where: {
        equipmentId: Number(equipmentId),
        status: { not: "CANCELLED" },
        AND: [
          { pickupDate: { lte: new Date(dropDate) } },
          { dropDate: { gte: new Date(pickupDate) } },
        ],
      },
    });

    if (overlapping.length >= equipment.quantity) {
      return res.status(400).json({
        success: false,
        message:
          "This equipment is fully booked for the selected dates. Please choose another date.",
      });
    }

    // ✅ Calculate total amount
    const start = new Date(pickupDate);
    const end = new Date(dropDate);
    const rentalDays = Math.max(
      1,
      Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    );

    const baseTotal =
      Number(equipment.price) * rentalDays + Number(travelCost || 0);
    const platformFee = baseTotal * 0.01;
    const finalTotal = baseTotal + platformFee;

    // ✅ Payment method normalization
    const allowedPayments = ["CASH", "UPI", "CARD", "BANK_TRANSFER"];
    const normalizedPaymentType = allowedPayments.includes(
      paymentMethod?.toUpperCase()
    )
      ? paymentMethod.toUpperCase()
      : "CASH";

    // ✅ Validate transport cost
    if (!travelCost || Number(travelCost) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please calculate transport cost before confirming booking.",
      });
    }

    const effectiveUserId = Number(userId) || 1;

    // ✅ Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: effectiveUserId,
        vendorId: equipment.vendorId,
        equipmentId: equipment.id,
        pickupDate: start,
        dropDate: end,
        address,
        totalAmount: finalTotal,
        paymentType: normalizedPaymentType,
        status: "PENDING",
        name,
      },
      include: {
        equipment: { select: { name: true, price: true } },
        user: { select: { name: true, email: true } },
      },
    });

    // ✅ Generate Reference ID
    const referenceId = `BOOK-${booking.id.toString().padStart(5, "0")}`;
    await prisma.booking.update({
      where: { id: booking.id },
      data: { referenceId },
    });

    res.json({
      success: true,
      referenceId,
      message: "Booking successfully created.",
    });
  } catch (error) {
    console.error("❌ Booking creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create booking.",
    });
  }
};

/* =====================================================
   🟡 GET BOOKINGS BY VENDOR (Vendor Dashboard)
   ===================================================== */
export const getBookingsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const bookings = await prisma.booking.findMany({
      where: { vendorId: Number(vendorId) },
      include: {
        equipment: {
          select: { id: true, name: true, price: true, images: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, items: bookings });
  } catch (error) {
    console.error("❌ Error fetching vendor bookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load vendor bookings.",
    });
  }
};

/* =====================================================
   🔵 GET BOOKINGS BY USER (User Dashboard)
   ===================================================== */
export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await prisma.booking.findMany({
      where: { userId: Number(userId) },
      include: {
        equipment: {
          select: { id: true, name: true, price: true, images: true },
        },
        vendor: {
          select: { id: true, name: true, companyName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, items: bookings });
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user bookings.",
    });
  }
};

/* =====================================================
   🔁 UPDATE BOOKING STATUS (Vendor Side)
//    ===================================================== */
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

/* =====================================================
   🟡 Vendor — Update Booking Status
   ===================================================== */
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status },
    });

    // 🟢 (Optional Future) Emit event here via WebSocket if needed

    res.json({ success: true, updated });
  } catch (error) {
    console.error("❌ Failed to update booking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update booking status",
    });
  }
};

/* =====================================================
   🕐 Get Unavailable Dates (for calendar blocking)
   ===================================================== */
export const getUnavailableDates = async (req, res) => {
  try {
    // ✅ Accept both param names for safety
    const equipmentId = Number(req.params.equipmentId || req.params.id);

    if (!equipmentId) {
      return res.status(400).json({ success: false, message: "Equipment ID is required" });
    }

    // ✅ Only fetch bookings for this specific equipment
    const bookings = await prisma.booking.findMany({
      where: {
        equipmentId,
        status: { not: "CANCELLED" },
      },
      select: { pickupDate: true, dropDate: true },
    });

    return res.json({ success: true, dates: bookings });
  } catch (error) {
    console.error("❌ Error fetching unavailable dates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unavailable dates",
    });
  }
};




// export const updateUserBooking = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { pickupDate, dropDate, quantity } = req.body;

//     const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });
//     if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

//     // ✅ Check for overlapping bookings for same equipment
//     const overlaps = await prisma.booking.findMany({
//       where: {
//         equipmentId: booking.equipmentId,
//         status: { not: "CANCELLED" },
//         id: { not: Number(id) },
//         AND: [
//           { pickupDate: { lte: new Date(dropDate) } },
//           { dropDate: { gte: new Date(pickupDate) } },
//         ],
//       },
//     });

//     const equipment = await prisma.equipment.findUnique({
//       where: { id: booking.equipmentId },
//       select: { price: true, quantity: true },
//     });

//     // if total overlapping quantity >= available
//     if (overlaps.length >= equipment.quantity)
//       return res.status(400).json({ success: false, message: "Selected dates not available" });

//     // ✅ Recalculate total
//     const start = new Date(pickupDate);
//     const end = new Date(dropDate);
//     const rentalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
//     const baseTotal = Number(equipment.price) * rentalDays * Number(quantity);
//     const finalTotal = baseTotal + baseTotal * 0.01;

//     const updated = await prisma.booking.update({
//       where: { id: Number(id) },
//       data: {
//         pickupDate: start,
//         dropDate: end,
//         quantity: Number(quantity),
//         totalAmount: finalTotal,
//         status: "PENDING",
//       },
//     });

//     res.json({ success: true, message: "Booking updated", updated });
//   } catch (err) {
//     console.error("❌ Error updating booking:", err);
//     res.status(500).json({ success: false, message: "Failed to update booking" });
//   }
// };

export const cancelUserBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status: "CANCELLED" },
    });
    res.json({ success: true, message: "Booking cancelled", updated });
  } catch (error) {
    console.error("❌ Cancel booking error:", error);
    res.status(500).json({ success: false, message: "Failed to cancel booking" });
  }
};
/* =====================================================
   🧩 CHECK BOOKING AVAILABILITY (for extensions / updates)
   ===================================================== */
export const checkBookingAvailability = async (req, res) => {
  try {
    const { equipmentId, from, to, excludeId } = req.query;

    if (!equipmentId || !from || !to) {
      return res
        .status(400)
        .json({ available: false, message: "Missing required parameters" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // ✅ validate date format
    if (isNaN(fromDate) || isNaN(toDate)) {
      return res
        .status(400)
        .json({ available: false, message: "Invalid date format provided" });
    }

    // 🧩 Check overlapping bookings
    const overlapping = await prisma.booking.findMany({
      where: {
        equipmentId: Number(equipmentId),
        status: { not: "CANCELLED" },
        id: excludeId ? { not: Number(excludeId) } : undefined,
        AND: [
          { pickupDate: { lte: toDate } },
          { dropDate: { gte: fromDate } },
        ],
      },
      select: { id: true, pickupDate: true, dropDate: true },
    });

    if (overlapping.length > 0) {
      return res.json({
        available: false,
        message: "This equipment is already booked in the selected range.",
        blocked: overlapping.map((b) => ({
          start: b.pickupDate,
          end: b.dropDate,
        })),
      });
    }

    res.json({ available: true });
  } catch (err) {
    console.error("❌ Availability check failed:", err);
    res
      .status(500)
      .json({ available: false, message: "Server error checking availability" });
  }
};

/* =====================================================
   🟢 UPDATE USER BOOKING (with continuous range check)
   ===================================================== */
export const updateUserBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { pickupDate, dropDate, quantity } = req.body;

    console.log("DEBUG incoming update:", { pickupDate, dropDate, quantity });

    const start = new Date(pickupDate);
    const end = new Date(dropDate);
    if (isNaN(start) || isNaN(end)) {
      console.log("❌ Invalid date", pickupDate, dropDate);
      return res.status(400).json({ success: false, message: "Invalid date format" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
    });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const equipment = await prisma.equipment.findUnique({
      where: { id: booking.equipmentId },
      select: { price: true, quantity: true },
    });

    const overlaps = await prisma.booking.findMany({
      where: {
        equipmentId: booking.equipmentId,
        status: { not: "CANCELLED" },
        id: { not: Number(id) },
        AND: [{ pickupDate: { lte: end } }, { dropDate: { gte: start } }],
      },
    });

    console.log("Overlaps found:", overlaps.length);

    if (overlaps.length >= equipment.quantity) {
      return res.status(400).json({
        success: false,
        message: "Cannot update booking. Overlapping active booking exists.",
      });
    }

    const rentalDays = Math.max(
      1,
      Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    );
    const baseTotal = Number(equipment.price) * rentalDays * Number(quantity || 1);
    const finalTotal = baseTotal + baseTotal * 0.01;

    const updated = await prisma.booking.update({
      where: { id: Number(id) },
      data: {
        pickupDate: start,
        dropDate: end,
        quantity: Number(quantity || 1),
        totalAmount: finalTotal,
        status: "PENDING",
      },
    });

    res.json({ success: true, message: "Booking updated", updated });
  } catch (err) {
    console.error("❌ Error updating booking:", err);
    res.status(500).json({ success: false, message: "Failed to update booking" });
  }
};

