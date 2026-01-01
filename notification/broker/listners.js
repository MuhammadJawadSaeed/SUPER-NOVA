const { subscribeToQueue } = require("./broker");
const { sendEmail } = require("../src/email");

module.exports = function () {
  subscribeToQueue("AUTH_NOTIFICATION.USER_CREATED", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
        <h1 style="color: #5a2d82;">Welcome to Our Service!</h1>
      </div>
      <div style="padding: 20px;">
        <p>Dear ${
          data.fullName.firstName + " " + (data.fullName.lastName || "")
        },</p>
        <p>Thank you for registering with us. We're excited to have you on board!</p>
        <p>We are committed to providing you with the best service possible.</p>
      </div>
      <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
        <p>Best regards,<br/><strong>The Team</strong></p>
      </div>
    </div>
    `;

    await sendEmail(
      data.email,
      "Welcome to Our Service",
      "Thank you for registering with us!",
      emailHTMLTemplate
    );
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
        <h1 style="color: #5a2d82;">Payment Initiated</h1>
      </div>
      <div style="padding: 20px;">
        <p>Dear ${data.username},</p>
        <p>Your payment of <strong>${data.currency} ${data.amount}</strong> for order ID: <strong>${data.orderId}</strong> has been initiated.</p>
        <p>We will notify you once the payment is completed.</p>
      </div>
      <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
        <p>Best regards,<br/><strong>The Team</strong></p>
      </div>
    </div>
    `;
    await sendEmail(
      data.email,
      "Payment Initiated",
      "Your payment is being processed",
      emailHTMLTemplate
    );
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Payment Successful!</h1>
      </div>
      <div style="padding: 20px;">
        <p>Dear ${data.username},</p>
        <p>We have received your payment of <strong>${data.currency} ${data.amount}</strong> for order ID: <strong>${data.orderId}</strong>.</p>
        <p>Thank you for your purchase!</p>
      </div>
      <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
        <p>Best regards,<br/><strong>The Team</strong></p>
      </div>
    </div>
    `;
    await sendEmail(
      data.email,
      "Payment Successful",
      "We have received your payment",
      emailHTMLTemplate
    );
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Payment Failed</h1>
      </div>
      <div style="padding: 20px;">
        <p>Dear ${data.username},</p>
        <p>Unfortunately, your payment for order ID: <strong>${data.orderId}</strong> has failed.</p>
        <p>Please try again or contact our support team if the issue persists.</p>
      </div>
      <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
        <p>Best regards,<br/><strong>The Team</strong></p>
      </div>
    </div>
    `;
    await sendEmail(
      data.email,
      "Payment Failed",
      "Your payment could not be processed",
      emailHTMLTemplate
    );
  });

  subscribeToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
        <h1 style="color: #5a2d82;">New Product Available!</h1>
      </div>
      <div style="padding: 20px;">
        <p>Dear ${data.username},</p>
        <p>A new product has just been launched. Check it out and enjoy exclusive launch offers!</p>
        <p><a href="http://localhost:3000/products/${data.productId}" style="display: inline-block; background-color: #5a2d82; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Product</a></p>
      </div>
      <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
        <p>Best regards,<br/><strong>The Team</strong></p>
      </div>
    </div>
    `;
    await sendEmail(
      data.email,
      "New Product Launched",
      "Check out our latest product",
      emailHTMLTemplate
    );
  });
};
