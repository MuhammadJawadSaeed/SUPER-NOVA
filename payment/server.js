require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/db");
const { connect } = require("./src/broker/broker");
// The payment service used to start an internal email consumer which
// consumed PAYMENT_NOTIFICATION.PAYMENT_COMPLETED messages. That caused
// the notification service to not receive them (competing consumer).
// Quick fix: do not start the payment-side consumer here. The dedicated
// notification service will handle sending emails.
// const { startEmailConsumer } = require('./src/borker/email.consumer');
const { startEmailConsumer } = require("./src/broker/email.consumer");

connectDB();
connect();
// Start the email consumer so this service sends notification emails
// for payment events (initiation/completion). If you run a dedicated
// notification service in production, consider disabling this here to
// avoid competing consumers.
startEmailConsumer()
  .then(() => console.log("Email consumer started"))
  .catch((err) => console.error("Failed to start email consumer", err));
app.listen(3004, () => {
  console.log("Payment is running on port 3004");
});

module.exports = app;
