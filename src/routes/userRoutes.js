import express from "express";
import { getUserProfile, updateUserProfile } from "../controllers/userController.js";
import { getUserById } from "../controllers/userController.js";
const router = express.Router();

router.get("/:id", getUserProfile);
router.put("/:id", updateUserProfile);
router.get("/:id", getUserById);

export default router;
