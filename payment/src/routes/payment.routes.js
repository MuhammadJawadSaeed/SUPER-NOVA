const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

// Create payment for an order
router.post(
  "/create/:orderId",
  createAuthMiddleware(["user"]),
  paymentController.createPayment
);

// JazzCash callback handler
router.post("/jazzcash/callback", paymentController.handleJazzCashCallback);

// Get payment status
router.get(
  "/status/:orderId",
  createAuthMiddleware(["user"]),
  paymentController.getPaymentStatus
);

module.exports = router;
