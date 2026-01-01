const paymentModel = require("../models/payment.model");
const axios = require("axios");
const jazzCashService = require("../services/jazzcash.service");
const { publishToQueue } = require("../broker/broker");

async function createPayment(req, res) {
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const orderId = req.params.orderId;
    const { paymentMethod = "JAZZCASH" } = req.body;

    // Fetch order details
    const orderResponse = await axios.get(
      `http://localhost:3003/api/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const order = orderResponse.data.order;

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Create payment record
    const payment = new paymentModel({
      order: order._id,
      orderId: orderId,
      user: req.user.id,
      amount: order.totalPrice.amount,
      paymentMethod: paymentMethod,
      status: "PENDING",
    });

    await payment.save();
    await publishToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED", payment);

    // Handle Jazzcash payment
    if (paymentMethod === "JAZZCASH") {
      const { params, transactionId, transactionUrl } =
        jazzCashService.createPaymentRequest(
          orderId,
          order.totalPrice.amount,
          req.user.email,
          req.user.phone
        );

      // Update payment with transaction ID
      payment.transactionId = transactionId;
      await payment.save();

      await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", {
        email: req.user.email,
        orderId: orderId,
        amount: order.totalPrice.amount,
        currency: order.totalPrice.currency,
        customerName:
          req.user.fullName?.firstName +
          " " +
          (req.user.fullName?.lastName || ""),
      });

      return res.status(200).json({
        message: "Payment initiated",
        paymentId: payment._id,
        transactionUrl: transactionUrl,
        formData: params,
      });
    }

    return res.status(200).json({
      message: "Payment created",
      payment: payment,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
}

async function handleJazzCashCallback(req, res) {
  try {
    const callbackData = req.body;

    // Verify the callback hash
    const isValid = jazzCashService.verifyCallback(callbackData);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid callback signature" });
    }

    // Find payment by transaction ID
    const payment = await paymentModel.findOne({
      transactionId: callbackData.pp_TxnRefNo,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment status
    payment.status = jazzCashService.parsePaymentStatus(
      callbackData.pp_ResponseCode
    );
    payment.responseCode = callbackData.pp_ResponseCode;
    payment.responseMessage = callbackData.pp_ResponseMessage;
    payment.paymentId = callbackData.pp_TxnRefNo;

    await payment.save();
    await publishToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE", payment);

    // If payment successful, update order status and send notification
    if (payment.status === "COMPLETE") {
      await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", {
        email: "customer@example.com", // You'll need to fetch user email
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: "PKR",
        customerName: "Customer",
      });

      try {
        await axios.patch(
          `http://localhost:3003/api/orders/${payment.orderId}/status`,
          { status: "CONFIRMED" }
        );
      } catch (err) {
        console.error("Failed to update order status:", err.message);
      }

      // Redirect to success page
      return res.redirect(
        `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/payment/success?orderId=${payment.orderId}`
      );
    } else if (payment.status === "FAILED") {
      await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", {
        email: "customer@example.com",
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        customerName: "Customer",
      });

      // Redirect to failure page
      return res.redirect(
        `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/payment/failed?orderId=${payment.orderId}`
      );
    }

    return res.status(200).json({ message: "Payment status updated", payment });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
}

async function getPaymentStatus(req, res) {
  try {
    const { orderId } = req.params;

    const payment = await paymentModel.findOne({ orderId: orderId });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({
      payment: {
        orderId: payment.orderId,
        status: payment.status,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        responseMessage: payment.responseMessage,
        createdAt: payment.createdAt,
      },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
}

// Listener-style payment creation and update for event-driven architecture
async function createPaymentFromEvent(payment) {
  return paymentModel.create(payment);
}

async function updatePaymentFromEvent(payment) {
  return paymentModel.findOneAndUpdate(
    { orderId: payment.orderId },
    { ...payment }
  );
}

module.exports = {
  createPayment,
  handleJazzCashCallback,
  getPaymentStatus,
  createPaymentFromEvent,
  updatePaymentFromEvent,
};
