import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRY = "7d";

const pickSafeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

export const register = async (req, res) => {
  try {
    console.log("🔐 /register body:", req.body); // TEMP LOG
    const { name, email, password, role = "USER" } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email, password are required" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hash, role },
    });

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return res.status(201).json({ success: true, token, user: pickSafeUser(user) });
  } catch (err) {
    console.error("❌ register error:", err);
    return res.status(500).json({ success: false, message: "Internal error at /register" });
  }
};

export const login = async (req, res) => {
  try {
    console.log("🔐 /login body:", req.body); // TEMP LOG
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password || "");
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return res.json({ success: true, token, user: pickSafeUser(user) });
  } catch (err) {
    console.error("❌ login error:", err);
    return res.status(500).json({ success: false, message: "Internal error at /login" });
  }
};
