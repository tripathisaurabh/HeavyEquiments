import Razorpay from "razorpay";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =====================================================
   🟢 Create Razorpay Order
   ===================================================== */
export const createOrder = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount || 0) * 100), // paise
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return res.json({ success: true, order });
  } catch (err) {
    console.error("❌ Razorpay order error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Order creation failed" });
  }
};

/* =====================================================
   🟡 Verify Razorpay Payment + Create Booking + Transaction
   NOTE: Prisma enum PaymentType = CASH | UPI | CARD | BANK_TRANSFER
   We'll mark Razorpay payments as CARD by default.
   ===================================================== */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData,
    } = req.body;

    // ✅ 1. Validate Razorpay parameters
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      await prisma.transaction.create({
        data: {
          bookingId: null,
          amount: Number(bookingData?.totalCost || 0),
          status: "FAILED",
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          paymentMethod: "MISSING_SIGNATURE",
        },
      });
      return res
        .status(400)
        .json({ success: false, message: "Missing Razorpay parameters" });
    }

    // ✅ 2. Verify Razorpay signature
    const generatedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const verified = generatedSign === razorpay_signature;

    // ✅ 3. Extract and validate booking data
    const {
      name,
      pickupDate,
      dropDate,
      address,
      equipmentId,
      totalCost,
      userId,
    } = bookingData || {};

    if (!bookingData || !equipmentId || !pickupDate || !dropDate || !userId) {
      await prisma.transaction.create({
        data: {
          bookingId: null,
          amount: Number(totalCost) || 0,
          status: "FAILED",
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          paymentMethod: "MISSING_BOOKING_DATA",
        },
      });
      return res.status(400).json({
        success: false,
        message: "Booking data missing in payment verification",
      });
    }

    // ✅ 4. Get vendor
    const equipment = await prisma.equipment.findUnique({
      where: { id: Number(equipmentId) },
      select: { vendorId: true },
    });

    if (!equipment) {
      await prisma.transaction.create({
        data: {
          bookingId: null,
          amount: Number(totalCost) || 0,
          status: "FAILED",
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          paymentMethod: "INVALID_EQUIPMENT",
        },
      });
      return res
        .status(404)
        .json({ success: false, message: "Equipment not found" });
    }

    // ✅ 5. Create booking only if verified
    let booking = null;
    if (verified) {
      booking = await prisma.booking.create({
        data: {
          userId: Number(userId),
          vendorId: equipment.vendorId,
          equipmentId: Number(equipmentId),
          pickupDate: new Date(pickupDate),
          dropDate: new Date(dropDate),
          address: address || "",
          totalAmount: Number(totalCost) || 0,
          paymentType: "CARD",
          status: "CONFIRMED",
          name: name || "Guest User",
        },
      });

      const referenceId = `BOOK-${booking.id.toString().padStart(5, "0")}`;
      await prisma.booking.update({
        where: { id: booking.id },
        data: { referenceId },
      });
    }

    // ✅ 6. Always create transaction (success or fail)
    await prisma.transaction.create({
      data: {
        bookingId: booking ? booking.id : null,
        amount: Number(totalCost) || 0,
        status: verified ? "SUCCESS" : "FAILED",
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        paymentMethod: verified ? "RAZORPAY" : "FAILED_RAZORPAY",
      },
    });

    if (!verified) {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    // ✅ 7. Respond success
    return res.json({
      success: true,
      message: "Payment verified & booking created",
      bookingId: booking.id,
    });
  } catch (err) {
    console.error("❌ Payment verification error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal payment verification error",
    });
  }
};
/* =====================================================
   🔴 Save Failed / Cancelled Transactions
   ===================================================== */
export const saveTransaction = async (req, res) => {
  try {
    const {
      bookingId, // may be null when payment failed before booking creation
      amount,
      status,
      razorpayOrderId,
      razorpayPaymentId,
      paymentMethod,
    } = req.body;

    const tx = await prisma.transaction.create({
      data: {
        bookingId: bookingId ? Number(bookingId) : null,
        amount: Number(amount) || 0,
        status: status || "FAILED",
        razorpayOrderId: razorpayOrderId || null,
        razorpayPaymentId: razorpayPaymentId || null,
        paymentMethod: paymentMethod || "UNKNOWN",
      },
    });

    return res.json({ success: true, transaction: tx });
  } catch (err) {
    console.error("❌ Save transaction error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to save transaction" });
  }
};

export const getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await prisma.transaction.findMany({
      where: {
        booking: {
          userId: Number(userId),
        },
      },
      include: {
        booking: {
          select: {
            referenceId: true,
            equipment: { select: { name: true } },
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, items: transactions });
  } catch (err) {
    console.error("❌ Error fetching transactions:", err);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};
