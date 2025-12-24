const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ["JAZZCASH", "CARD", "COD"],
      default: "JAZZCASH",
    },
    transactionId: {
      type: String,
    },
    responseCode: {
      type: String,
    },
    responseMessage: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETE", "FAILED"],
      default: "PENDING",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

const paymentModel = mongoose.model("payment", paymentSchema);

module.exports = paymentModel;
