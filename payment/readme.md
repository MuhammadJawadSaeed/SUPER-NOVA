# JazzCash Payment Integration

This payment service now supports JazzCash payment gateway integration.

## Features

- JazzCash Mobile Wallet (MWALLET) payment integration
- Secure hash generation and verification
- Payment callback handling
- Order status updates after successful payment
- Payment status tracking

## Configuration

### 1. Environment Variables

Add these to your `.env` file:

```env
# JazzCash Configuration
JAZZCASH_MERCHANT_ID=your_merchant_id_here
JAZZCASH_PASSWORD=your_password_here
JAZZCASH_INTEGRITY_SALT=your_integrity_salt_here
JAZZCASH_RETURN_URL=http://localhost:3004/api/payments/jazzcash/callback
JAZZCASH_TRANSACTION_URL=https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/
FRONTEND_URL=http://localhost:3000
```

### 2. Get JazzCash Credentials

1. Register as a merchant at [JazzCash Sandbox Portal](https://sandbox.jazzcash.com.pk/)
2. Get your Merchant ID, Password, and Integrity Salt from the portal
3. For production, use: `https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/`

## API Endpoints

### 1. Create Payment

**POST** `/api/payments/create/:orderId`

Creates a payment for an order and returns JazzCash form data.

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "paymentMethod": "JAZZCASH"
}
```

**Response:**

```json
{
  "message": "Payment initiated",
  "paymentId": "payment_id",
  "transactionUrl": "https://sandbox.jazzcash.com.pk/...",
  "formData": {
    "pp_Version": "1.1",
    "pp_TxnType": "MWALLET",
    "pp_Amount": "100000",
    "pp_TxnRefNo": "T1234567890"
    // ... other fields
  }
}
```

### 2. JazzCash Callback

**POST** `/api/payments/jazzcash/callback`

Handles JazzCash payment callback (automatically called by JazzCash).

### 3. Get Payment Status

**GET** `/api/payments/status/:orderId`

Check payment status for an order.

**Response:**

```json
{
  "payment": {
    "orderId": "order_id",
    "status": "COMPLETE",
    "amount": 1000,
    "paymentMethod": "JAZZCASH",
    "transactionId": "T1234567890",
    "responseMessage": "Success",
    "createdAt": "2025-12-24T00:00:00.000Z"
  }
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

## Payment Flow

1. **User initiates payment**

   - Frontend calls `/api/payments/create/:orderId`
   - Backend creates payment record and returns JazzCash form data

2. **User redirected to JazzCash**

   - Frontend submits form with payment details to JazzCash
   - User enters their JazzCash credentials

3. **Payment processing**

   - JazzCash processes the payment
   - User completes payment on JazzCash portal

4. **Callback handling**
   - JazzCash redirects back to `/api/payments/jazzcash/callback`
   - Backend verifies the callback signature
   - Updates payment status and order status
   - Redirects user to success/failure page

## Payment Status

- `PENDING` - Payment initiated but not completed
- `COMPLETE` - Payment successful
- `FAILED` - Payment failed

## Security

- All requests are signed with HMAC-SHA256
- Callback signatures are verified before processing
- Timestamps prevent replay attacks
- Transaction expiry time is 1 hour

## Testing

For testing in sandbox environment:

- Use JazzCash test credentials from sandbox portal
- Test mobile numbers: 03xxxxxxxxx
- Test amounts: Any amount between PKR 10 - 10,000

## Production Deployment

Before going live:

1. Update `JAZZCASH_TRANSACTION_URL` to production URL
2. Use production credentials from JazzCash
3. Update `JAZZCASH_RETURN_URL` to your production domain
4. Ensure HTTPS is enabled on callback URL
5. Test thoroughly in production environment

## Troubleshooting

### Invalid Hash Error

- Verify all credentials are correct
- Ensure no extra spaces in environment variables
- Check that amount is in paisa (multiply by 100)

### Callback Not Received

- Ensure return URL is publicly accessible
- Check firewall settings
- Verify callback URL is whitelisted with JazzCash

### Payment Status Not Updating

- Check order service is running
- Verify order API endpoint is correct
- Check network connectivity between services
