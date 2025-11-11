import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, name: true, email: true, phone: true, address: true, companyName: true },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching profile" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, address, companyName } = req.body;
    const updated = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { name, phone, address, companyName },
    });
    res.json({ success: true, user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
};
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

/* =====================================================
   🔵 Get Single User by ID
   ===================================================== */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        companyName: true,
        role: true,
        profileImg: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
    });
  }
};
