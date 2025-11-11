import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import {
  getEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../controllers/equipmentController.js";

const router = express.Router();
const prisma = new PrismaClient(); // ✅ FIXED: Prisma client initialized here

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"), false);
  },
});

// ✅ CRUD Routes
// router.get("/:id", getEquipmentById);
// router.post("/", upload.array("images", 5), createEquipment);
// router.put("/:id", upload.array("images", 5), updateEquipment);
// router.delete("/:id", deleteEquipment);
router.get("/", getEquipments);
router.get("/search", async (req, res) => {
  const { q } = req.query;

  try {
    if (!q || q.trim() === "") {
      const all = await prisma.equipment.findMany({
        take: 12,
        include: { vendor: true, images: true },
      });
      return res.json({ results: all, related: [] });
    }

    const results = await prisma.equipment.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { type: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { vendor: true, images: true },
    });

    // Related equipments (if none found)
    let related = [];
    if (results.length === 0) {
      related = await prisma.equipment.findMany({
        take: 6,
        include: { vendor: true, images: true },
      });
    }

    res.json({ results, related });
  } catch (err) {
    console.error("❌ Search Error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});
router.get("/:id", getEquipmentById);
router.post("/", upload.array("images", 5), createEquipment);
router.put("/:id", upload.array("images", 5), updateEquipment);
router.delete("/:id", deleteEquipment);
export default router;
