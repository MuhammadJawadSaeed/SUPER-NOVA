# Payment Service

Payment processing service for the SUPER-NOVA e-commerce platform. Handles payment gateway integration with JazzCash, payment creation, callback processing, status tracking, and automatic notifications via RabbitMQ.

## Overview

The Payment Service is a microservice that provides:

- JazzCash Mobile Wallet (MWALLET) payment gateway integration
- Secure payment request generation with HMAC-SHA256 hashing
- Payment callback verification and processing
- Payment status tracking (PENDING, COMPLETE, FAILED)
- Order status synchronization with Order Service
- Automated email notifications for payment events
- JWT-based authentication with role validation
- Event publishing to message broker
- Frontend redirection after payment completion

## Architecture

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas for production, local for testing)
- **Payment Gateway**: JazzCash (Mobile Wallet)
- **Message Broker**: RabbitMQ (CloudAMQP)
- **Cryptography**: crypto-js for hash generation
- **HTTP Client**: Axios (for service-to-service communication)
- **Authentication**: JWT (JSON Web Tokens)

## Features

### Payment Processing

- Create payment requests for orders
- Generate secure payment forms for JazzCash
- Process payment callbacks from gateway
- Verify payment signature for security
- Track payment status in real-time
- Support multiple payment methods (JAZZCASH, CARD, COD)

### JazzCash Integration

- Mobile Wallet (MWALLET) transaction type
- HMAC-SHA256 secure hash generation
- Callback signature verification
- Transaction ID generation
- Amount conversion to paisa (PKR \* 100)
- Expiry time management

### Order Integration

- Fetches order details from Order Service
- Updates order status on successful payment
- Validates order existence before payment
- Synchronizes payment and order status

### Notifications

- Payment initiation notifications
- Payment success notifications
- Payment failure notifications
- Automated email via Notification Service

### Event Publishing

- Publishes payment events to RabbitMQ
- Notifies Seller Dashboard of payments
- Triggers email notifications
- Real-time payment tracking

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (for production) OR local MongoDB
- JazzCash Merchant Account (Sandbox or Production)
- Running Order Service (port 3003)
- Running Auth Service (for JWT token generation)
- RabbitMQ instance (CloudAMQP or local)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root of the payment directory:

```env
# Production/Development Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/payment?retryWrites=true&w=majority

# Test Database (Local MongoDB)
TEST_MONGO_URI=mongodb://localhost:27017/payment_test_db

# JWT Secret (must match Auth Service)
JWT_SECRET=your_secret_key_here

# Frontend URL (for redirects after payment)
CLIENT_URL=http://localhost:3000

# RabbitMQ Configuration
RABBIT_URL=amqps://username:password@your-rabbitmq-host/vhost

# JazzCash Configuration
JAZZCASH_MERCHANT_ID=your_merchant_id_here
JAZZCASH_PASSWORD=your_password_here
JAZZCASH_INTEGRITY_SALT=your_integrity_salt_here
JAZZCASH_RETURN_URL=http://localhost:3004/api/payment/jazzcash/callback
JAZZCASH_API_URL=https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/
```

### Environment Variable Details

| Variable                  | Description                                                     | Required  | Example                                               |
| ------------------------- | --------------------------------------------------------------- | --------- | ----------------------------------------------------- |
| `MONGO_URI`               | MongoDB Atlas connection string for production/development      | Yes       | `mongodb+srv://user:pass@cluster.mongodb.net/payment` |
| `TEST_MONGO_URI`          | Local MongoDB connection for testing                            | For tests | `mongodb://localhost:27017/payment_test_db`           |
| `JWT_SECRET`              | Secret key for JWT token verification (must match Auth Service) | Yes       | `your_random_secret_key_here`                         |
| `CLIENT_URL`              | Frontend URL for redirects after payment                        | Yes       | `http://localhost:3000`                               |
| `RABBIT_URL`              | RabbitMQ connection URL (AMQP)                                  | Yes       | `amqps://user:pass@host/vhost`                        |
| `JAZZCASH_MERCHANT_ID`    | JazzCash Merchant ID from portal                                | Yes       | `MC378331`                                            |
| `JAZZCASH_PASSWORD`       | JazzCash Password from portal                                   | Yes       | `52uvs73svy`                                          |
| `JAZZCASH_INTEGRITY_SALT` | JazzCash Integrity Salt for hash generation                     | Yes       | `s34asz1u08`                                          |
| `JAZZCASH_RETURN_URL`     | Callback URL for JazzCash to send payment result                | Yes       | `http://localhost:3004/api/payment/jazzcash/callback` |
| `JAZZCASH_API_URL`        | JazzCash transaction URL (sandbox or production)                | Yes       | `https://sandbox.jazzcash.com.pk/...`                 |

### Getting JazzCash Credentials

**For Sandbox (Testing):**

1. **Register as Merchant:**

   - Visit [JazzCash Sandbox Portal](https://sandbox.jazzcash.com.pk/)
   - Create merchant account
   - Complete registration process

2. **Get Credentials:**

   - Login to sandbox portal
   - Navigate to merchant settings
   - Copy Merchant ID
   - Copy Password
   - Copy Integrity Salt

3. **Configure URLs:**
   - **Sandbox API URL:** `https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/`
   - **Return URL:** Your callback endpoint (must be publicly accessible or use ngrok for local testing)

**For Production:**

1. Contact JazzCash Business Team
2. Complete merchant agreement
3. Receive production credentials
4. Use production API URL: `https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/`

**Testing with ngrok (for local development):**

```bash
# Install ngrok
npm install -g ngrok

# Expose local port 3004
ngrok http 3004

# Use ngrok URL as JAZZCASH_RETURN_URL
# Example: https://abc123.ngrok.io/api/payment/jazzcash/callback
```

## Running the Application

### Development Mode

```bash
# Start with auto-reload using nodemon
npm run dev
```

The server will start on port 3004 with hot-reloading enabled.

### Production Mode

```bash
# Start without auto-reload
npm start
```

### Verify Service is Running

```bash
# Test health endpoint
curl http://localhost:3004/

# Expected response:
# {"message": "Payment Service is running."}
```

**Console Output on Successful Start:**

```
Connected to RabbitMQ
Payment is running on port 3004
```

## API Endpoints

### Create Payment

```
POST /api/payment/create/:orderId
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**URL Parameters:**

- `orderId`: The MongoDB ObjectId of the order

**Request Body:**

```json
{
  "paymentMethod": "JAZZCASH"
}
```

**Validation:**

- Order must exist and be accessible by user
- Amount must be valid

**Response:** `200 OK`

```json
{
  "message": "Payment initiated",
  "paymentId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "transactionUrl": "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/",
  "formData": {
    "pp_Version": "1.1",
    "pp_TxnType": "MWALLET",
    "pp_Language": "EN",
    "pp_MerchantID": "MC378331",
    "pp_SubMerchantID": "",
    "pp_Password": "52uvs73svy",
    "pp_TxnRefNo": "T1704240000000",
    "pp_Amount": "99900",
    "pp_TxnCurrency": "PKR",
    "pp_TxnDateTime": "20260102120000",
    "pp_BillReference": "65a1b2c3d4e5f6g7h8i9j0k1",
    "pp_Description": "Payment for order 65a1b2c3d4e5f6g7h8i9j0k1",
    "pp_TxnExpiryDateTime": "20260102130000",
    "pp_ReturnURL": "http://localhost:3004/api/payment/jazzcash/callback",
    "pp_SecureHash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "ppmpf_1": "user@example.com",
    "ppmpf_2": "03001234567",
    "ppmpf_3": "",
    "ppmpf_4": "",
    "ppmpf_5": ""
  }
}
```

**Frontend Implementation:**

After receiving the response, submit the form data to JazzCash:

```html
<form id="jazzcash-form" method="POST" action="${transactionUrl}">
  <input type="hidden" name="pp_Version" value="${formData.pp_Version}" />
  <input type="hidden" name="pp_TxnType" value="${formData.pp_TxnType}" />
  <!-- Add all other formData fields as hidden inputs -->
  <button type="submit">Pay with JazzCash</button>
</form>
```

**Error Responses:**

- `401 Unauthorized` - No token provided
- `404 Not Found` - Order not found
- `500 Internal Server Error` - Server error

**Behavior:**

1. Validates user authentication
2. Fetches order details from Order Service
3. Creates payment record in database
4. Generates JazzCash transaction ID
5. Creates secure hash for payment form
6. Publishes payment initiation event
7. Sends payment initiation email
8. Returns form data for frontend submission

---

### JazzCash Callback Handler

```
POST /api/payment/jazzcash/callback
```

**Description:** Automatically called by JazzCash after payment completion

**Request Body:** (Sent by JazzCash)

```json
{
  "pp_Version": "1.1",
  "pp_TxnType": "MWALLET",
  "pp_Language": "EN",
  "pp_MerchantID": "MC378331",
  "pp_SubMerchantID": "",
  "pp_Password": "52uvs73svy",
  "pp_TxnRefNo": "T1704240000000",
  "pp_Amount": "99900",
  "pp_TxnCurrency": "PKR",
  "pp_TxnDateTime": "20260102120000",
  "pp_BillReference": "order_id",
  "pp_Description": "Payment for order",
  "pp_ResponseCode": "000",
  "pp_ResponseMessage": "Success",
  "pp_SecureHash": "verification_hash"
}
```

**Response:** Redirects to frontend

**Success:**

```
Redirect to: http://localhost:3000/payment/success?orderId=...
```

**Failure:**

```
Redirect to: http://localhost:3000/payment/failed?orderId=...
```

**Behavior:**

1. Receives callback data from JazzCash
2. Verifies secure hash signature
3. Finds payment by transaction ID
4. Updates payment status based on response code
5. Publishes payment update event
6. Sends payment completion/failure email
7. Updates order status (if successful)
8. Redirects user to appropriate frontend page

**Response Codes:**

- `000`, `121`, `200` → COMPLETE (Success)
- `124`, `125` → PENDING
- All others → FAILED

---

### Get Payment Status

```
GET /api/payment/status/:orderId
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**URL Parameters:**

- `orderId`: The order ID (not payment ID)

**Response:** `200 OK`

```json
{
  "payment": {
    "orderId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "status": "COMPLETE",
    "amount": 999,
    "paymentMethod": "JAZZCASH",
    "transactionId": "T1704240000000",
    "responseMessage": "Success",
    "createdAt": "2026-01-02T12:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Payment not found
- `500 Internal Server Error` - Server error

---

### Health Check

```
GET /
```

**Response:** `200 OK`

```json
{
  "message": "Payment Service is running."
}
```

## Frontend Integration

### Example: Create Payment Form

```javascript
async function initiatePayment(orderId) {
  const response = await fetch(`/api/payments/create/${orderId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethod: "JAZZCASH",
    }),
  });

  const data = await response.json();

  // Create a form with the returned formData
  const form = document.createElement("form");
  form.method = "POST";
  form.action = data.transactionUrl;

  // Add all form fields
  Object.keys(data.formData).forEach((key) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = data.formData[key];
    form.appendChild(input);
  });

  // Submit the form
  document.body.appendChild(form);
  form.submit();
}
```

### Example: Check Payment Status

```javascript
async function checkPaymentStatus(orderId) {
  const response = await fetch(`/api/payments/status/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log("Payment Status:", data.payment.status);
}
```

## Database Schema

### Payment Model

```javascript
{
  order: {
    type: ObjectId,
    required: true,
    // Reference to order ID from Order Service
  },
  paymentId: {
    type: String,
    // External payment ID from gateway
  },
  orderId: {
    type: String,
    required: true
  },
  signature: {
    type: String,
    // Payment signature for verification
  },
  paymentMethod: {
    type: String,
    enum: ["JAZZCASH", "CARD", "COD"],
    default: "JAZZCASH"
  },
  transactionId: {
    type: String,
    // JazzCash transaction reference number
  },
  responseCode: {
    type: String,
    // Response code from payment gateway
  },
  responseMessage: {
    type: String,
    // Response message from payment gateway
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETE", "FAILED"],
    default: "PENDING"
  },
  user: {
    type: ObjectId,
    required: true,
    // Reference to user ID from Auth Service
  },
  timestamps: true  // Adds createdAt and updatedAt
}
```

**Indexes:**

- `orderId`: Indexed for fast payment lookups by order
- `transactionId`: Indexed for callback processing
- `user`: Indexed for user payment history

## Message Broker Events

### Published Events

The Payment Service publishes the following events to RabbitMQ:

#### 1. Payment Created Event

**Queue:** `PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED`

**Payload:**

```json
{
  "_id": "payment_id",
  "order": "order_id",
  "orderId": "order_string_id",
  "user": "user_id",
  "amount": 999,
  "paymentMethod": "JAZZCASH",
  "status": "PENDING",
  "transactionId": "T1704240000000",
  "createdAt": "2026-01-02T...",
  "updatedAt": "2026-01-02T..."
}
```

**Purpose:** Notifies Seller Dashboard of new payment for tracking

---

#### 2. Payment Initiated Notification

**Queue:** `PAYMENT_NOTIFICATION.PAYMENT_INITIATED`

**Payload:**

```json
{
  "email": "user@example.com",
  "orderId": "order_id",
  "amount": 999,
  "currency": "PKR",
  "customerName": "John Doe"
}
```

**Purpose:** Triggers email notification to user about payment initiation

---

#### 3. Payment Update Event

**Queue:** `PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE`

**Payload:**

```json
{
  "_id": "payment_id",
  "order": "order_id",
  "orderId": "order_string_id",
  "status": "COMPLETE",
  "responseCode": "000",
  "responseMessage": "Success",
  "paymentId": "T1704240000000",
  ...
}
```

**Purpose:** Notifies Seller Dashboard of payment status changes

---

#### 4. Payment Completed Notification

**Queue:** `PAYMENT_NOTIFICATION.PAYMENT_COMPLETED`

**Payload:**

```json
{
  "email": "user@example.com",
  "orderId": "order_id",
  "paymentId": "T1704240000000",
  "amount": 999,
  "currency": "PKR",
  "customerName": "John Doe"
}
```

**Purpose:** Triggers success email notification to user

---

#### 5. Payment Failed Notification

**Queue:** `PAYMENT_NOTIFICATION.PAYMENT_FAILED`

**Payload:**

```json
{
  "email": "user@example.com",
  "orderId": "order_id",
  "paymentId": "T1704240000000",
  "customerName": "John Doe"
}
```

**Purpose:** Triggers failure email notification to user

## JazzCash Integration Details

### Hash Generation Process

JazzCash uses HMAC-SHA256 for secure hash generation:

1. **Sort Parameters:** Sort all form parameters alphabetically by key
2. **Build Hash String:** Concatenate: `INTEGRITY_SALT&value1&value2&...`
3. **Generate Hash:** HMAC-SHA256(hash_string, INTEGRITY_SALT)
4. **Add to Form:** Include as `pp_SecureHash` parameter

**Example:**

```javascript
const hashString = "s34asz1u08&1.1&MWALLET&EN&MC378331&...";
const hash = crypto
  .createHmac("sha256", INTEGRITY_SALT)
  .update(hashString)
  .digest("hex");
```

### Transaction ID Format

Transaction IDs are generated as: `T` + timestamp

**Example:** `T1704240000000`

### Amount Conversion

JazzCash requires amount in paisa (smallest currency unit):

- **Formula:** `amount_in_paisa = amount_in_PKR * 100`
- **Example:** PKR 999.00 → 99900 paisa

### DateTime Format

JazzCash requires specific datetime format: `YYYYMMDDHHmmss`

**Example:** `20260102120000` (Jan 2, 2026, 12:00:00)

### Response Codes

| Code   | Status  | Description                              |
| ------ | ------- | ---------------------------------------- |
| 000    | SUCCESS | Transaction successful                   |
| 121    | SUCCESS | Transaction pending (will be successful) |
| 200    | SUCCESS | Transaction reversed                     |
| 124    | PENDING | Waiting for user input                   |
| 125    | PENDING | Pending                                  |
| Others | FAILED  | Transaction failed                       |

### Callback Verification

1. Receive callback data from JazzCash
2. Extract `pp_SecureHash` from callback
3. Remove `pp_SecureHash` from data
4. Generate hash from remaining data
5. Compare generated hash with received hash
6. Process payment if hashes match

## Payment Flow

1. **User initiates payment**

   - Frontend calls `/api/payment/create/:orderId`
   - Backend creates payment record and returns JazzCash form data

2. **User redirected to JazzCash**

   - Frontend submits form with payment details to JazzCash
   - User enters their JazzCash credentials

3. **Payment processing**

   - JazzCash processes the payment
   - User completes payment on JazzCash portal

4. **Callback handling**
   - JazzCash redirects back to `/api/payment/jazzcash/callback`
   - Backend verifies the callback signature
   - Updates payment status and order status
   - Redirects user to success/failure page

## Middleware

### Authentication Middleware

Role-based authentication middleware that validates JWT tokens.

**Features:**

- Accepts token from cookies or Authorization header
- Verifies token with JWT_SECRET
- Checks user role (user)
- Attaches decoded user data to `req.user`

**Usage:**

```javascript
router.post("/create/:orderId", createAuthMiddleware(["user"]), controller);
```

**Response Codes:**

- `401 Unauthorized` - No token provided
- `401 Unauthorized` - Invalid token
- `403 Forbidden` - Insufficient permissions

## Docker Deployment

### Build Docker Image

```bash
# From project root
docker build -t supernova-payment:latest ./payment

# Or from payment directory
cd payment
docker build -t supernova-payment:latest .
```

### Run Docker Container

```bash
docker run -d \
  -p 3004:3004 \
  -e MONGO_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  -e CLIENT_URL=your_frontend_url \
  -e RABBIT_URL=your_rabbitmq_url \
  -e JAZZCASH_MERCHANT_ID=your_merchant_id \
  -e JAZZCASH_PASSWORD=your_password \
  -e JAZZCASH_INTEGRITY_SALT=your_salt \
  -e JAZZCASH_RETURN_URL=your_callback_url \
  -e JAZZCASH_API_URL=jazzcash_api_url \
  --name payment-service \
  supernova-payment:latest
```

### Docker Compose

```yaml
payment:
  build: ./payment
  ports:
    - "3004:3004"
  environment:
    - MONGO_URI=${MONGO_URI}
    - JWT_SECRET=${JWT_SECRET}
    - CLIENT_URL=${CLIENT_URL}
    - RABBIT_URL=${RABBIT_URL}
    - JAZZCASH_MERCHANT_ID=${JAZZCASH_MERCHANT_ID}
    - JAZZCASH_PASSWORD=${JAZZCASH_PASSWORD}
    - JAZZCASH_INTEGRITY_SALT=${JAZZCASH_INTEGRITY_SALT}
    - JAZZCASH_RETURN_URL=${JAZZCASH_RETURN_URL}
    - JAZZCASH_API_URL=${JAZZCASH_API_URL}
  depends_on:
    - auth
    - order
    - rabbitmq
```

## Service Dependencies

The Payment Service integrates with:

- **Auth Service** (port 3000): For JWT token generation and validation
- **Order Service** (port 3003): Fetches order details and updates order status
- **Notification Service**: Receives payment notification events via RabbitMQ
- **Seller Dashboard** (port 3007): Receives payment events via RabbitMQ
- **RabbitMQ**: Message broker for event publishing
- **JazzCash Gateway**: Payment processing

## Service Integration Flow

### Payment Creation Flow

```
1. User clicks "Checkout" on frontend
2. Frontend sends create payment request to Payment Service
3. Payment Service authenticates user
4. Payment Service fetches order from Order Service
5. Payment Service creates payment record
6. Payment Service generates JazzCash form data
7. Payment Service publishes initiation event
8. Notification Service sends initiation email
9. Payment Service returns form data to frontend
10. Frontend submits form to JazzCash
11. User completes payment on JazzCash
12. JazzCash sends callback to Payment Service
13. Payment Service verifies and processes callback
14. Payment Service updates payment status
15. Payment Service updates order status (if successful)
16. Payment Service publishes completion/failure event
17. Notification Service sends success/failure email
18. JazzCash redirects user to frontend
```

## Testing

### Manual Testing with Sandbox

1. **Create Order:** Use Order Service to create an order
2. **Initiate Payment:** Call create payment endpoint
3. **Use Test Cards:** JazzCash provides test mobile wallet numbers
4. **Complete Payment:** Follow JazzCash sandbox flow
5. **Verify Callback:** Check payment status updates

### JazzCash Test Credentials

Contact JazzCash for sandbox test credentials including:

- Test mobile wallet numbers
- Test OTP codes
- Test transaction scenarios

### Testing Locally with ngrok

```bash
# 1. Start payment service
npm run dev

# 2. Expose with ngrok
ngrok http 3004

# 3. Update .env
JAZZCASH_RETURN_URL=https://your-ngrok-url.ngrok.io/api/payment/jazzcash/callback

# 4. Restart service
npm run dev
```

## Frontend Integration Example

### React Payment Flow

```javascript
import React, { useState } from "react";

function CheckoutPage({ orderId }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. Create payment
      const response = await fetch(
        `http://localhost:3004/api/payment/create/${orderId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Send cookies
          body: JSON.stringify({ paymentMethod: "JAZZCASH" }),
        }
      );

      const data = await response.json();

      // 2. Create form dynamically
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.transactionUrl;

      // 3. Add all form fields
      Object.keys(data.formData).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = data.formData[key];
        form.appendChild(input);
      });

      // 4. Submit form to JazzCash
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error("Payment error:", error);
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? "Processing..." : "Pay with JazzCash"}
    </button>
  );
}

// Payment Success Page
function PaymentSuccess() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");

  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Order ID: {orderId}</p>
      <a href="/orders">View Orders</a>
    </div>
  );
}

// Payment Failure Page
function PaymentFailed() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");

  return (
    <div>
      <h1>Payment Failed</h1>
      <p>Order ID: {orderId}</p>
      <button onClick={() => (window.location.href = `/checkout/${orderId}`)}>
        Retry Payment
      </button>
    </div>
  );
}
```

## Error Handling

**Common Error Responses:**

```json
// Unauthorized
{
  "message": "Unauthorized: No token provided"
}

// Order Not Found
{
  "message": "Order not found"
}

// Payment Not Found
{
  "message": "Payment not found"
}

// Invalid Callback
{
  "message": "Invalid callback signature"
}

// Internal Server Error
{
  "message": "Internal server error",
  "error": "Error details"
}
```

## Troubleshooting

### Common Issues

**MongoDB Connection Error:**

```
Error: connect ECONNREFUSED
```

**Solutions:**

- Verify MONGO_URI is correct
- Check network access in MongoDB Atlas
- Ensure IP whitelist includes your IP

**Order Service Connection Error:**

```
Error: connect ECONNREFUSED 127.0.0.1:3003
```

**Solutions:**

- Ensure Order Service is running on port 3003
- Check Order Service is accessible
- Verify network connectivity

**JWT Verification Failed:**

```
Unauthorized: Invalid token
```

**Solutions:**

- Ensure JWT_SECRET matches Auth Service
- Check token is being sent correctly
- Verify token hasn't expired

**Invalid Callback Signature:**

```
Invalid callback signature
```

**Solutions:**

- Verify JAZZCASH_INTEGRITY_SALT is correct
- Check callback data is not modified
- Ensure hash generation matches JazzCash

**JazzCash Callback Not Received:**
**Solutions:**

- Ensure JAZZCASH_RETURN_URL is publicly accessible
- Use ngrok for local testing
- Check JazzCash portal for callback logs
- Verify firewall settings

**Payment Stuck in PENDING:**
**Solutions:**

- Check JazzCash transaction status in merchant portal
- Verify callback was received and processed
- Check server logs for callback errors
- Manually update payment status if needed

**RabbitMQ Connection Error:**

```
Error connecting to RabbitMQ
```

**Solutions:**

- Verify RABBIT_URL is correct
- Check CloudAMQP instance is active
- Ensure credentials are correct

## Payment Status

- `PENDING` - Payment initiated but not completed
- `COMPLETE` - Payment successful
- `FAILED` - Payment failed

## Security Best Practices

- **Never expose credentials:** Keep JazzCash credentials in environment variables
- **Verify all callbacks:** Always verify secure hash before processing
- **Use HTTPS:** Use SSL/TLS for production
- **Validate amounts:** Verify payment amount matches order amount
- **Token security:** Use HTTP-only cookies for JWT tokens
- **Rate limiting:** Implement rate limiting on payment endpoints
- **Logging:** Log all payment activities for auditing
- **Error handling:** Don't expose sensitive info in error messages
- **Callback validation:** Verify callback origin is JazzCash
- **Timestamps:** Prevent replay attacks with expiry times

## Performance Considerations

- **Async processing:** Non-blocking payment operations
- **Connection pooling:** Reuses database connections
- **Event-driven:** Asynchronous notification via RabbitMQ
- **Efficient queries:** Indexed lookups by orderId and transactionId
- **Timeout handling:** Set appropriate timeouts for Order Service calls

## Monitoring & Logging

### Important Logs

```javascript
// Payment creation
"Payment initiated for order: <orderId>";

// Callback received
"Callback received for transaction: <transactionId>";

// Payment status updated
"Payment status updated: <status>";

// Order status updated
"Order status updated successfully";
"Failed to update order status: <error>";

// Notification sent
"Payment notification published";
```

## Production Deployment

Before going live:

1. Update `JAZZCASH_API_URL` to production URL
2. Use production credentials from JazzCash
3. Update `JAZZCASH_RETURN_URL` to your production domain
4. Ensure HTTPS is enabled on callback URL
5. Test thoroughly in production environment
6. Monitor payment transactions
7. Set up alerting for failed payments

## Future Enhancements

- Support for multiple payment gateways (Stripe, PayPal, EasyPaisa)
- Payment refund functionality
- Recurring payments/subscriptions
- Payment analytics dashboard
- Installment payment options
- Wallet/stored payment methods
- Payment receipt generation
- Dispute management
- Automated reconciliation
- Multi-currency support

## License

ISC
