// backend/src/controllers/equipmentController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all equipments
export const getEquipments = async (req, res) => {
  try {
    const { vendorId, from, to, equipment } = req.query;
    const whereClause = vendorId ? { vendorId: parseInt(vendorId) } : {};

    // Optional name filter
    if (equipment) {
      whereClause.name = { contains: equipment, mode: "insensitive" };
    }

    let excludeIds = [];

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      // 1️⃣ Fetch overlapping bookings
      const overlapping = await prisma.booking.findMany({
        where: {
          status: { not: "CANCELLED" },
          AND: [
            { pickupDate: { lte: toDate } },
            { dropDate: { gte: fromDate } },
          ],
        },
        select: {
          equipmentId: true,
          quantity: true, // 🔹 each booking’s quantity
        },
      });

      // 2️⃣ Group by equipmentId and count booked quantities
      const bookedMap = {};
      for (const b of overlapping) {
        if (!b.equipmentId) continue;
        bookedMap[b.equipmentId] = (bookedMap[b.equipmentId] || 0) + (b.quantity || 1);
      }

      // 3️⃣ Fetch all equipments to compare total quantity
      const allEquipments = await prisma.equipment.findMany({
        where: whereClause,
        select: { id: true, quantity: true },
      });

      // 4️⃣ Determine which are fully booked
      excludeIds = allEquipments
        .filter((eq) => {
          const booked = bookedMap[eq.id] || 0;
          return booked >= (eq.quantity || 1);
        })
        .map((eq) => eq.id);

      console.log("⛔ Fully booked equipment IDs:", excludeIds);
    }

    // 5️⃣ Fetch only available equipments
    const equipments = await prisma.equipment.findMany({
      where: {
        ...whereClause,
        ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
      },
      include: {
        vendor: { select: { id: true, name: true, companyName: true } },
        images: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 6️⃣ Format image URLs
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const formatted = equipments.map((eq) => ({
      ...eq,
      images: eq.images.map((img) =>
        img.url.startsWith("http") ? img.url : `${baseUrl}${img.url}`
      ),
      imageUrl:
        eq.images.length > 0
          ? eq.images[0].url.startsWith("http")
            ? eq.images[0].url
            : `${baseUrl}${eq.images[0].url}`
          : null,
    }));

    res.json({
      items: formatted,
      total: formatted.length,
      page: 1,
      limit: formatted.length,
    });
  } catch (error) {
    console.error("❌ Error fetching equipments:", error);
    res.status(500).json({ error: "Failed to fetch equipments" });
  }
};




// 🟢 Get single equipment by ID
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

export const getEquipmentById = async (req, res) => {
  try {
    // ✅ Extract id safely
    const idParam = req.params.id;

    // ✅ Validate id
    if (!idParam || isNaN(Number(idParam))) {
      console.log("⚠️ Invalid ID received:", idParam);
      return res.status(400).json({ error: "Invalid or missing equipment ID" });
    }

    const id = Number(idParam);

    // ✅ Fetch from Prisma
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { images: true, vendor: true },
    });

    if (!equipment) {
      console.log("⚠️ Equipment not found:", id);
      return res.status(404).json({ error: "Equipment not found" });
    }

    res.json(equipment);
  } catch (err) {
    console.error("❌ Error fetching equipment:", err);
    res.status(500).json({ error: "Failed to fetch equipment" });
  }
};

// 🟢 Create equipment
export const createEquipment = async (req, res) => {
  try {
    const {
      name,
      type,
      price,
      description,
      vendorId,
      baseAddress,
      baseLat,
      baseLng,
      perKmRate,
      quantity,   // ✅ added
    } = req.body;

    if (!name || !type || !price || !vendorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newEquipment = await prisma.equipment.create({
      data: {
        name,
        type,
        price: parseFloat(price),
        description: description || "",
        vendorId: parseInt(vendorId),
        baseAddress: baseAddress || null,
        baseLat: baseLat ? parseFloat(baseLat) : null,
        baseLng: baseLng ? parseFloat(baseLng) : null,
        perKmRate: perKmRate ? parseFloat(perKmRate) : 150,
        quantity: quantity ? parseInt(quantity) : 1, // ✅ fixed
      },
    });

    if (req.files && req.files.length > 0) {
      const imageRecords = req.files.map((file) => ({
        url: `/uploads/${file.filename}`,
        equipmentId: newEquipment.id,
      }));
      await prisma.equipmentImage.createMany({ data: imageRecords });
    }

    res.status(201).json({
      message: "✅ Equipment added successfully",
      equipment: newEquipment,
    });
  } catch (error) {
    console.error("❌ Error creating equipment:", error);
    res.status(500).json({ message: "Failed to create equipment" });
  }
};


// 🟢 Update equipment
export const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      price,
      description,
      baseAddress,
      baseLat,
      baseLng,
      perKmRate,
      quantity,   // ✅ added
    } = req.body;

    const updated = await prisma.equipment.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        price: parseFloat(price),
        description: description || "",
        baseAddress: baseAddress || null,
        baseLat: baseLat ? parseFloat(baseLat) : null,
        baseLng: baseLng ? parseFloat(baseLng) : null,
        perKmRate: perKmRate ? parseFloat(perKmRate) : 150,
        quantity: quantity ? parseInt(quantity) : 1, // ✅ fixed
      },
    });

    if (req.files && req.files.length > 0) {
      const imageRecords = req.files.map((file) => ({
        url: `/uploads/${file.filename}`,
        equipmentId: updated.id,
      }));
      await prisma.equipmentImage.createMany({ data: imageRecords });
    }

    res.json({ message: "✅ Equipment updated successfully", updated });
  } catch (error) {
    console.error("❌ Error updating equipment:", error);
    res.status(500).json({ message: "Failed to update equipment" });
  }
};

// 🟢 Delete equipment
export const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.equipment.delete({ where: { id: parseInt(id) } });
    res.json({ message: "✅ Equipment deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting equipment:", error);
    res.status(500).json({ message: "Failed to delete equipment" });
  }
};





