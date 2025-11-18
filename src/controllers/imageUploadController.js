import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import path from "path";
import fs from "fs";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Temporary local storage before uploading
const upload = multer({ dest: "temp/" });

export const uploadEquipmentImages = [
  upload.array("images", 5),

  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No files uploaded" });
      }

      const uploadedImages = [];

      for (const file of req.files) {
        const fileExt = path.extname(file.originalname);
        const fileName = `equipment_${Date.now()}_${Math.random()}${fileExt}`;

        const fileBuffer = fs.readFileSync(file.path);

        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET)
          .upload(fileName, fileBuffer, {
            contentType: file.mimetype,
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from(process.env.SUPABASE_BUCKET)
          .getPublicUrl(fileName);

        uploadedImages.push({ url: publicUrl.publicUrl });

        // Delete temp file
        fs.unlinkSync(file.path);
      }

      return res.json({ success: true, images: uploadedImages });

    } catch (err) {
      console.error("❌ Supabase upload error:", err);
      return res.status(500).json({ success: false, message: "Upload failed" });
    }
  }
];
