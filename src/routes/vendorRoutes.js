import express from "express";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// ✅ Setup multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ✅ Get Vendor Profile
router.get("/:vendorId", async (req, res) => {
  try {
    const vendorId = parseInt(req.params.vendorId);
    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        companyName: true,
        profileImg: true,
      },
    });

    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.status(200).json(vendor);
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update Vendor Profile (with image)
router.put("/:vendorId", upload.single("profileImg"), async (req, res) => {
  try {
    const vendorId = parseInt(req.params.vendorId);
    const { name, phone, address, companyName } = req.body;

    const updated = await prisma.user.update({
      where: { id: vendorId },
      data: {
        name,
        phone,
        address,
        companyName,
        profileImg: req.file ? `/uploads/${req.file.filename}` : undefined,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      vendor: updated,
    });
  } catch (error) {
    console.error("Error updating vendor profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
