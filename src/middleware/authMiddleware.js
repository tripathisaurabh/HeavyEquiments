// backend/src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = decoded; // Attach user info (id, email, role)
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(403).json({ success: false, message: "Authentication failed" });
  }
};
