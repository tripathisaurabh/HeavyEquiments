import express from "express";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { supabase } from "../utils/supabase.js";

import {
  getEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../controllers/equipmentController.js";

const router = express.Router();
const prisma = new PrismaClient();

/* =====================================================
   Multer – Memory Storage (No Local Uploads)
===================================================== */
const upload = multer({
  storage: multer.memoryStorage(), // store file in RAM buffer
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"), false);
  },
});

/* =====================================================
   Helper Function – Upload Images to Supabase
===================================================== */
async function uploadToSupabase(files) {
  const bucket = process.env.SUPABASE_BUCKET;
  const uploadedImages = [];

  for (const file of files) {
    const ext = path.extname(file.originalname);
    const fileName = `equipment_${Date.now()}_${Math.random()}${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.mimetype,
      });

    if (error) throw error;

    // Get Public URL
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    uploadedImages.push({ url: publicUrl.publicUrl });
  }

  return uploadedImages;
}

/* =====================================================
   Routes
===================================================== */

// GET All Equipments
router.get("/", getEquipments);

// SEARCH
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

// GET By ID
router.get("/:id", getEquipmentById);

/* =====================================================
   CREATE Equipment with Supabase Upload
===================================================== */
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
      uploadedImages = await uploadToSupabase(req.files);
    }

    req.body.images = uploadedImages; // pass to controller
    return createEquipment(req, res);
  } catch (err) {
    console.error("❌ Create Error:", err);
    return res.status(500).json({ success: false, message: "Failed to create equipment" });
  }
});

/* =====================================================
   UPDATE Equipment with Supabase Upload
===================================================== */
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
      uploadedImages = await uploadToSupabase(req.files);
    }

    req.body.images = uploadedImages;
    return updateEquipment(req, res);
  } catch (err) {
    console.error("❌ Update Error:", err);
    return res.status(500).json({ success: false, message: "Failed to update equipment" });
  }
});

/* =====================================================
   DELETE
===================================================== */
router.delete("/:id", deleteEquipment);

export default router;
