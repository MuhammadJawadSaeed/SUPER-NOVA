# Notification Service

Event-driven notification service for the SUPER-NOVA e-commerce platform. Handles automated email notifications based on events from other microservices using RabbitMQ message broker and Gmail SMTP with OAuth2 authentication.

## Overview

The Notification Service is an event-driven microservice that provides:

- Automated email notifications triggered by system events
- RabbitMQ message queue subscription and processing
- Gmail SMTP integration with OAuth2 authentication
- HTML email templates for professional communication
- Welcome emails for new user registrations
- Payment status notifications (initiated, completed, failed)
- Product launch announcements
- Asynchronous message processing

## Architecture

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Email Service**: Nodemailer with Gmail OAuth2
- **Message Broker**: RabbitMQ (CloudAMQP)
- **Authentication**: Google OAuth2

## Features

### Email Notifications

- Welcome emails for new user registrations
- Payment initiation confirmations
- Payment success notifications
- Payment failure alerts
- New product launch announcements

### Event-Driven Processing

- Subscribes to multiple RabbitMQ queues
- Asynchronous message consumption
- Automatic message acknowledgment
- Durable queue configuration

### Email Capabilities

- HTML email templates with styling
- Plain text fallback
- Professional formatting
- Personalized content with user data
- Gmail OAuth2 secure authentication

## Prerequisites

- Node.js (v14 or higher)
- Gmail account with OAuth2 credentials
- Google Cloud Project with Gmail API enabled
- RabbitMQ instance (CloudAMQP or local)
- Running Auth Service (for user registration events)
- Running Payment Service (for payment events)
- Running Product Service (for product events)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root of the notification directory:

```env
# Gmail OAuth2 Configuration
CLIENT_ID=your_client_id.apps.googleusercontent.com
CLIENT_SECRET=your_client_secret
REFRESH_TOKEN=your_refresh_token
EMAIL_USER=your_email@gmail.com

# RabbitMQ Configuration
RABBIT_URL=amqps://username:password@your-rabbitmq-host/vhost
```

### Environment Variable Details

| Variable        | Description                       | Required | Example                                       |
| --------------- | --------------------------------- | -------- | --------------------------------------------- |
| `CLIENT_ID`     | Google OAuth2 Client ID           | Yes      | `554753806125-xxx.apps.googleusercontent.com` |
| `CLIENT_SECRET` | Google OAuth2 Client Secret       | Yes      | `GOCSPX-xxxxxxxxxx`                           |
| `REFRESH_TOKEN` | Google OAuth2 Refresh Token       | Yes      | `1//04xxxxxxxxxx`                             |
| `EMAIL_USER`    | Gmail address to send emails from | Yes      | `your-email@gmail.com`                        |
| `RABBIT_URL`    | RabbitMQ connection URL (AMQP)    | Yes      | `amqps://user:pass@host/vhost`                |

### Setting Up Gmail OAuth2

To get OAuth2 credentials for Gmail:

1. **Create Google Cloud Project:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Gmail API:**

   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

3. **Create OAuth2 Credentials:**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs: `https://developers.google.com/oauthplayground`

4. **Get Refresh Token:**

   - Go to [OAuth2 Playground](https://developers.google.com/oauthplayground/)
   - Click settings icon (top right)
   - Check "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret
   - In the left panel, select "Gmail API v1" > "https://mail.google.com/"
   - Click "Authorize APIs"
   - Sign in with your Gmail account
   - Click "Exchange authorization code for tokens"
   - Copy the "Refresh token"

5. **Add to .env file:**
   - Copy all credentials to your `.env` file

### RabbitMQ Setup

**Using CloudAMQP:**

1. Create account at [CloudAMQP](https://www.cloudamqp.com/)
2. Create an instance
3. Get AMQP URL from instance details

**Using Local RabbitMQ:**

```bash
# Install RabbitMQ
# Windows: Download from https://www.rabbitmq.com/install-windows.html
# Mac: brew install rabbitmq
# Linux: sudo apt-get install rabbitmq-server

# Start RabbitMQ
# Windows: rabbitmq-server
# Mac/Linux: sudo service rabbitmq-server start

# Use URL: amqp://localhost:5672
```

## Running the Application

### Development Mode

```bash
# Start with auto-reload using nodemon
npm run dev
```

The server will start on port 3006 with hot-reloading enabled.

### Production Mode

```bash
# Start without auto-reload
npm start
```

### Verify Service is Running

```bash
# Test health endpoint
curl http://localhost:3006/

# Expected response:
# {"message": "Notification service is running"}
```

**Console Output on Successful Start:**

```
Connected to RabbitMQ
Email server is ready to send messages
Notification service is running on port 3006
```

## Message Queue Events

The Notification Service listens to the following RabbitMQ queues:

### 1. User Registration Event

**Queue:** `AUTH_NOTIFICATION.USER_CREATED`

**Published By:** Auth Service

**Payload:**

```json
{
  "id": "user_id",
  "username": "johndoe",
  "email": "john@example.com",
  "fullName": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Email Sent:**

- **Subject:** "Welcome to Our Service"
- **To:** User's email
- **Content:** Welcome message with user's name

---

### 2. Payment Initiated Event

**Queue:** `PAYMENT_NOTIFICATION.PAYMENT_INITIATED`

**Published By:** Payment Service

**Payload:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "orderId": "order_123",
  "amount": "99.99",
  "currency": "USD"
}
```

**Email Sent:**

- **Subject:** "Payment Initiated"
- **To:** User's email
- **Content:** Payment initiation confirmation with order details

---

### 3. Payment Completed Event

**Queue:** `PAYMENT_NOTIFICATION.PAYMENT_COMPLETED`

**Published By:** Payment Service

**Payload:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "orderId": "order_123",
  "amount": "99.99",
  "currency": "USD"
}
```

**Email Sent:**

- **Subject:** "Payment Successful"
- **To:** User's email
- **Content:** Payment success confirmation with green success banner

---

### 4. Payment Failed Event

**Queue:** `PAYMENT_NOTIFICATION.PAYMENT_FAILED`

**Published By:** Payment Service

**Payload:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "orderId": "order_123"
}
```

**Email Sent:**

- **Subject:** "Payment Failed"
- **To:** User's email
- **Content:** Payment failure notification with support information

---

### 5. Product Created Event

**Queue:** `PRODUCT_NOTIFICATION.PRODUCT_CREATED`

**Published By:** Product Service

**Payload:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "productId": "product_123"
}
```

**Email Sent:**

- **Subject:** "New Product Launched"
- **To:** User's email
- **Content:** New product announcement with link to product page

## API Endpoints

### Health Check

```
GET /
```

**Response:** `200 OK`

```json
{
  "message": "Notification service is running"
}
```

**Note:** This service is event-driven and doesn't expose traditional REST API endpoints for sending notifications. All notifications are triggered automatically by RabbitMQ messages.

## Email Templates

All emails use professionally styled HTML templates with:

- Responsive design (max-width: 600px)
- Header with colored background
- Personalized greeting
- Clear message content
- Professional footer
- Consistent branding

### Example Email Template Structure

```html
<div
  style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 10px;"
>
  <!-- Header -->
  <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
    <h1 style="color: #5a2d82;">Email Title</h1>
  </div>

  <!-- Content -->
  <div style="padding: 20px;">
    <p>Dear {{username}},</p>
    <p>Email content goes here...</p>
  </div>

  <!-- Footer -->
  <div style="background-color: #f4f4f4; padding: 10px; text-align: center;">
    <p>Best regards,<br /><strong>The Team</strong></p>
  </div>
</div>
```

## Docker Deployment

### Build Docker Image

```bash
# From project root
docker build -t supernova-notification:latest ./notification

# Or from notification directory
cd notification
docker build -t supernova-notification:latest .
```

### Run Docker Container

```bash
docker run -d \
  -p 3006:3006 \
  -e CLIENT_ID=your_client_id \
  -e CLIENT_SECRET=your_client_secret \
  -e REFRESH_TOKEN=your_refresh_token \
  -e EMAIL_USER=your_email@gmail.com \
  -e RABBIT_URL=your_rabbitmq_url \
  --name notification-service \
  supernova-notification:latest
```

### Docker Compose

```yaml
notification:
  build: ./notification
  ports:
    - "3006:3006"
  environment:
    - CLIENT_ID=${CLIENT_ID}
    - CLIENT_SECRET=${CLIENT_SECRET}
    - REFRESH_TOKEN=${REFRESH_TOKEN}
    - EMAIL_USER=${EMAIL_USER}
    - RABBIT_URL=${RABBIT_URL}
  depends_on:
    - rabbitmq
```

## Service Integration Flow

### User Registration Flow

```
1. User registers on frontend
2. Frontend sends request to Auth Service
3. Auth Service creates user in database
4. Auth Service publishes to AUTH_NOTIFICATION.USER_CREATED queue
5. Notification Service receives message
6. Notification Service sends welcome email to user
```

### Payment Flow

```
1. User completes payment
2. Payment Service processes payment
3. Payment Service publishes to PAYMENT_NOTIFICATION.PAYMENT_* queue
4. Notification Service receives message
5. Notification Service sends payment status email
```

## Service Dependencies

The Notification Service integrates with:

- **RabbitMQ**: Message broker for event subscriptions
- **Gmail API**: Email delivery via OAuth2
- **Auth Service**: Receives user registration events
- **Payment Service**: Receives payment status events
- **Product Service**: Receives product launch events

## Features in Detail

### RabbitMQ Broker

- **Connection Management:** Automatic reconnection on failure
- **Queue Configuration:** Durable queues for message persistence
- **Message Acknowledgment:** Manual ack after successful email send
- **Error Handling:** Logged errors with graceful degradation

### Email Service

- **OAuth2 Authentication:** Secure Gmail authentication
- **Connection Verification:** Checks email server on startup
- **Async Processing:** Non-blocking email sending
- **HTML Support:** Rich formatted emails
- **Plain Text Fallback:** Text version for compatibility
- **Error Logging:** Detailed error messages for debugging

## Troubleshooting

### Common Issues

**Email Server Connection Error:**

```
Error connecting to email server
```

**Solutions:**

- Verify all Gmail OAuth2 credentials are correct
- Check CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN
- Ensure Gmail API is enabled in Google Cloud Console
- Verify EMAIL_USER is the correct Gmail address
- Check if "Less secure app access" is enabled (if not using OAuth2)

**RabbitMQ Connection Error:**

```
Error connecting to RabbitMQ
```

**Solutions:**

- Verify RABBIT_URL is correct
- Check CloudAMQP instance is active
- Ensure credentials in URL are correct
- Test connection with RabbitMQ management console

**Emails Not Sending:**

```
Error sending email
```

**Solutions:**

- Check email service configuration
- Verify recipient email addresses are valid
- Check spam/junk folder for test emails
- Review nodemailer error logs in console
- Ensure Gmail account has proper permissions

**OAuth2 Token Expired:**

```
Error: invalid_grant
```

**Solutions:**

- Refresh token might have expired
- Generate new refresh token from OAuth2 Playground
- Update REFRESH_TOKEN in .env file
- Restart the service

**Queue Messages Not Processing:**
**Solutions:**

- Verify queue names match publisher services
- Check RabbitMQ management console for message count
- Ensure message format matches expected payload
- Check listener callback functions for errors

## Monitoring & Logging

### Console Logs

The service logs the following events:

```javascript
// On startup
"Connected to RabbitMQ";
"Email server is ready to send messages";
"Notification service is running on port 3006";

// On email sent
"Message sent: <message-id>";
"Preview URL: <ethereal-url>"; // For testing

// On errors
"Error connecting to RabbitMQ: <error>";
"Error sending email: <error>";
```

### Email Preview

For development, nodemailer provides preview URLs for sent emails (when using Ethereal Email for testing).

## Performance Considerations

- **Async Processing:** Non-blocking email operations
- **Queue Durability:** Messages persist across restarts
- **Connection Pooling:** Reuses SMTP connections
- **Error Recovery:** Automatic RabbitMQ reconnection
- **Message Acknowledgment:** Only after successful email send

## Security Features

- **OAuth2 Authentication:** Secure Gmail API access
- **Environment Variables:** Sensitive credentials not in code
- **AMQPS Protocol:** Encrypted RabbitMQ connections
- **No Public API:** Event-driven only, no external exposure
- **Token Security:** Refresh tokens stored securely

## Best Practices

- Always use OAuth2 for production Gmail integration
- Monitor RabbitMQ queue sizes for message buildup
- Implement retry logic for failed email sends
- Use durable queues for message persistence
- Log all email activities for auditing
- Test email templates across different email clients
- Set up email delivery monitoring
- Use environment-specific email addresses for testing

## Testing Email Functionality

### Test with Ethereal Email (Development)

```javascript
// Modify email.js for testing
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "ethereal-username",
    pass: "ethereal-password",
  },
});
```

### Manual Testing

```bash
# Publish test message to RabbitMQ
# Use RabbitMQ management console or CLI

rabbitmqadmin publish \
  exchange=amq.default \
  routing_key=AUTH_NOTIFICATION.USER_CREATED \
  payload='{"email":"test@example.com","fullName":{"firstName":"Test","lastName":"User"}}'
```

## Future Enhancements

- SMS notifications integration
- Push notifications for mobile apps
- Email template customization via admin panel
- Notification preferences management
- Bulk email sending
- Email scheduling
- Delivery status tracking
- Bounce and complaint handling

## License

ISC
