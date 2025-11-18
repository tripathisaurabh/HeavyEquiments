import express from "express";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { supabase } from "../utils/supabase.js";

import {
  getAllEquipments,
  getVendorEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../controllers/equipmentController.js";

const router = express.Router();
const prisma = new PrismaClient();

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

/* ------------------ Upload helper ------------------ */
async function uploadToSupabase(files) {
  const bucket = process.env.SUPABASE_BUCKET;
  const uploaded = [];

  for (const file of files) {
    const ext = path.extname(file.originalname);
    const name = `equipment_${Date.now()}_${Math.random()}${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(name, file.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.mimetype,
      });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(name);
    uploaded.push({ url: data.publicUrl });
  }

  return uploaded;
}

/* ------------------ ROUTES ------------------ */

/** 🌍 PUBLIC — Marketplace Equipments (NO vendorId) */
router.get("/", getAllEquipments);

/** 👤 VENDOR — Only their Equipments */
router.get("/vendor", getVendorEquipments);

/** 🔍 SINGLE */
router.get("/:id", getEquipmentById);

/** ➕ CREATE */
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    req.body.images =
      req.files?.length ? await uploadToSupabase(req.files) : [];

    return createEquipment(req, res);
  } catch (err) {
    console.error("❌ create error:", err);
    return res.status(500).json({ success: false, message: "Failed" });
  }
});

/** ✏️ UPDATE */
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    req.body.images =
      req.files?.length ? await uploadToSupabase(req.files) : [];

    return updateEquipment(req, res);
  } catch (err) {
    console.error("❌ update error:", err);
    return res.status(500).json({ success: false });
  }
});

/** ❌ DELETE */
router.delete("/:id", deleteEquipment);

export default router;
