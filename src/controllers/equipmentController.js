import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* =====================================================
   GET ALL EQUIPMENTS
===================================================== */
export const getEquipments = async (req, res) => {
  try {
    const equipments = await prisma.equipment.findMany({
      include: { images: true, vendor: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return res.json({ success: true, equipments });
  } catch (err) {
    console.error("❌ getEquipments error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch equipments" });
  }
};

/* =====================================================
   GET SINGLE EQUIPMENT BY ID
===================================================== */
export const getEquipmentById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { images: true, vendor: true },
    });

    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }

    return res.json({ success: true, equipment });

  } catch (err) {
    console.error("❌ getEquipmentById error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch equipment" });
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

    const images = req.body.images || []; // Supabase URLs added by route

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
          create: images.map((img) => ({ url: img.url })),
        },
      },
      include: { images: true },
    });

    return res.json({ success: true, equipment });

  } catch (err) {
    console.error("❌ createEquipment error:", err);
    return res.status(500).json({ success: false, message: "Failed to create equipment" });
  }
};

/* =====================================================
   UPDATE EQUIPMENT
===================================================== */
export const updateEquipment = async (req, res) => {
  try {
    const id = Number(req.params.id);

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

    // Supabase URLs
    const newImages = req.body.images || [];

    // Remove old images
    await prisma.equipmentImage.deleteMany({
      where: { equipmentId: id },
    });

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
          create: newImages.map((img) => ({ url: img.url })),
        },
      },
      include: { images: true },
    });

    return res.json({ success: true, updated });

  } catch (err) {
    console.error("❌ updateEquipment error:", err);
    return res.status(500).json({ success: false, message: "Failed to update equipment" });
  }
};

/* =====================================================
   DELETE EQUIPMENT
===================================================== */
export const deleteEquipment = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.equipment.delete({
      where: { id },
    });

    return res.json({ success: true, message: "Equipment deleted" });

  } catch (err) {
    console.error("❌ deleteEquipment error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete equipment" });
  }
};
