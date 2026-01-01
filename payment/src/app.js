// Inside src/app.js

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

// Import the payment routes
const paymentRoutes = require("./routes/payment.routes");

app.use(express.json());
app.use(cookieParser());

// Tell the app to use the payment routes for any URL starting with /api/payment
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Payment Service is running." });
});

module.exports = app;
