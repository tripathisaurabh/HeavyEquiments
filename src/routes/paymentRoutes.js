import express from "express";
import {
  createOrder,
  verifyPayment,
  saveTransaction,
  getUserTransactions,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/order", createOrder);
router.post("/verify", verifyPayment);
router.post("/save-transaction", saveTransaction);
router.get("/transactions/:userId", getUserTransactions);

export default router;
