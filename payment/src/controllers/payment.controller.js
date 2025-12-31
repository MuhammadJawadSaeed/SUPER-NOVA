const axios = require("axios");
const paymentModel = require("../models/payment.model");
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
      amount: order.total,
      paymentMethod: paymentMethod,
      status: "PENDING",
    });

    await payment.save();

    // Handle JazzCash payment
    if (paymentMethod === "JAZZCASH") {
      const { params, transactionId, transactionUrl } =
        jazzCashService.createPaymentRequest(
          orderId,
          order.total,
          req.user.email,
          req.user.phone
        );

      // Update payment with transaction ID
      payment.transactionId = transactionId;
      await payment.save();

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

    // If payment successful, update order status
    if (payment.status === "COMPLETE") {
      const token =
        req.cookies?.token || req.headers?.authorization?.split(" ")[1];

      if (token) {
        try {
          await axios.patch(
            `http://localhost:3003/api/orders/${payment.orderId}/status`,
            { status: "CONFIRMED" },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (err) {
          console.error("Failed to update order status:", err.message);
        }
      }

      // Redirect to success page
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment/success?orderId=${payment.orderId}`
      );
    } else {
      // Redirect to failure page
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment/failed?orderId=${payment.orderId}`
      );
    }
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

module.exports = { createPayment, handleJazzCashCallback, getPaymentStatus };
