const axios = require("axios");
const paymentModel = require("../models/payment.model");

async function createPayment(req, res) {
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  try {
    const orderId = req.params.orderId;
    const orderResponse = await axios.get(
      `http://localhost:3003/api/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(orderResponse.data.order);
    
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error", error : err });
  }
}

module.exports = { createPayment };
