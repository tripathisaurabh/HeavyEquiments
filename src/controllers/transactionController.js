import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* =====================================================
   🟢 Get User Transactions
   ===================================================== */
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
            id: true,
            referenceId: true,
            totalAmount: true,
            paymentType: true,
            equipment: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, items: transactions });
  } catch (err) {
    console.error("❌ Transaction fetch error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch transactions" });
  }
};
