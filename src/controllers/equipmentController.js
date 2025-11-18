import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* =====================================================
   GLOBAL – GET ALL EQUIPMENTS (Marketplace)
===================================================== */
export const getAllEquipments = async (req, res) => {
  try {
    const equipments = await prisma.equipment.findMany({
      include: { images: true, vendor: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, items: equipments });
  } catch (err) {
    console.error("❌ getAllEquipments:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch equipments" });
  }
};

/* =====================================================
   VENDOR – GET ONLY THEIR OWN EQUIPMENTS
   Route: GET /api/equipments/vendor/:vendorId
===================================================== */
export const getVendorEquipments = async (req, res) => {
  try {
    const vendorId = Number(req.params.vendorId);

    console.log("🔍 getVendorEquipments vendorId:", vendorId);

    if (!vendorId || isNaN(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required in the URL",
      });
    }

    const equipments = await prisma.equipment.findMany({
      where: { vendorId },
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, items: equipments });
  } catch (err) {
    console.error("❌ getVendorEquipments:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch vendor equipments" });
  }
};

/* =====================================================
   GET SINGLE EQUIPMENT BY ID
   Route: GET /api/equipments/:id
===================================================== */
export const getEquipmentById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid equipment ID is required",
      });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { images: true, vendor: true },
    });

    if (!equipment) {
      return res
        .status(404)
        .json({ success: false, message: "Equipment not found" });
    }

    return res.json({ success: true, equipment });
  } catch (err) {
    console.error("❌ getEquipmentById:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch equipment" });
  }
};

/* =====================================================
   CREATE EQUIPMENT
===================================================== */
export const createEquipment = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      price,
      vendorId,
      brand,
      model,
      capacity,
      year,
      quantity,
      baseAddress,
      landmark,
      pincode,
      baseLat,
      baseLng,
      perKmRate,
    } = req.body;

    const images = Array.isArray(req.body.images) ? req.body.images : [];

    const equipment = await prisma.equipment.create({
      data: {
        name,
        type,
        description,
        price: parseFloat(price),
        vendorId: Number(vendorId),
        brand,
        model,
        capacity,
        year: year ? Number(year) : null,
        quantity: quantity ? Number(quantity) : 1,
        baseAddress,
        landmark,
        pincode,
        baseLat: baseLat ? parseFloat(baseLat) : null,
        baseLng: baseLng ? parseFloat(baseLng) : null,
        perKmRate: perKmRate ? parseFloat(perKmRate) : null,

        images: {
          create: images.map((img) => ({
            url: img.url,
          })),
        },
      },
      include: { images: true },
    });

    return res.json({ success: true, equipment });
  } catch (err) {
    console.error("❌ createEquipment:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create equipment" });
  }
};

/* =====================================================
   UPDATE
===================================================== */
export const updateEquipment = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid equipment ID is required",
      });
    }

    const {
      name,
      type,
      description,
      price,
      brand,
      model,
      capacity,
      year,
      quantity,
      baseAddress,
      landmark,
      pincode,
      baseLat,
      baseLng,
      perKmRate,
    } = req.body;

    const newImages = Array.isArray(req.body.images) ? req.body.images : [];

    await prisma.equipmentImage.deleteMany({ where: { equipmentId: id } });

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        name,
        type,
        description,
        price: parseFloat(price),
        brand,
        model,
        capacity,
        year: year ? Number(year) : null,
        quantity: quantity ? Number(quantity) : 1,
        baseAddress,
        landmark,
        pincode,
        baseLat: baseLat ? parseFloat(baseLat) : null,
        baseLng: baseLng ? parseFloat(baseLng) : null,
        perKmRate: perKmRate ? parseFloat(perKmRate) : null,

        images: {
          create: newImages.map((img) => ({
            url: img.url,
          })),
        },
      },
      include: { images: true },
    });

    return res.json({ success: true, updated });
  } catch (err) {
    console.error("❌ updateEquipment:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update equipment" });
  }
};

/* =====================================================
   DELETE
===================================================== */
export const deleteEquipment = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid equipment ID is required",
      });
    }

    await prisma.equipment.delete({ where: { id } });

    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("❌ deleteEquipment:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete equipment" });
  }
};
