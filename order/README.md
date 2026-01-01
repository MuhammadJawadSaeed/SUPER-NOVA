# Order Service

Order management service for the SUPER-NOVA e-commerce platform. Handles order creation, retrieval, cancellation, and shipping address management with integration to Cart and Product services.

## Overview

The Order Service is a microservice that provides:

- Order creation from user's shopping cart
- Order listing with pagination
- Order retrieval by ID
- Order cancellation (pending orders only)
- Shipping address updates (pending orders only)
- Stock validation before order creation
- Price calculation from product data
- JWT-based authentication with role validation
- Event publishing to message broker
- Integration with Cart and Product services

## Architecture

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas for production, local for testing)
- **Message Broker**: RabbitMQ (CloudAMQP)
- **Authentication**: JWT (JSON Web Tokens)
- **HTTP Client**: Axios (for service-to-service communication)
- **Testing**: Jest with Supertest
- **Validation**: Express-validator

## Features

### Order Management

- Create orders from cart items
- Automatic price calculation
- Stock validation before order creation
- Order status tracking (PENDING, CONFIRMED, CANCELLED, SHIPPED, DELIVERED)
- Order history with pagination
- Individual order retrieval
- Cancel pending orders
- Update shipping address for pending orders

### Integration

- Fetches cart data from Cart Service
- Retrieves product details from Product Service
- Publishes order events to Seller Dashboard via RabbitMQ
- Validates product stock availability
- Calculates total price from product prices

### Security

- JWT token authentication (cookie or header-based)
- Role-based access control (user, admin)
- Protected routes with auth middleware
- Owner verification for order access
- Input validation for all operations

### Business Logic

- Only allow order creation if cart has items
- Validate stock availability before order creation
- Calculate order total from product prices
- Only allow cancellation of PENDING orders
- Only allow address updates for PENDING orders
- Prevent unauthorized access to other users' orders

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (for production) OR local MongoDB
- Local MongoDB (for testing - must be installed and running)
- Running Cart Service (port 3002)
- Running Product Service (port 3001)
- Running Auth Service (for JWT token generation)
- RabbitMQ instance (CloudAMQP or local)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root of the order directory:

```env
# Production/Development Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/order?retryWrites=true&w=majority

# Test Database (Local MongoDB)
TEST_MONGO_URI=mongodb://localhost:27017/order_test_db

# JWT Secret (must match Auth Service)
JWT_SECRET=your_secret_key_here

# RabbitMQ Configuration
RABBIT_URL=amqps://username:password@your-rabbitmq-host/vhost
```

### Environment Variable Details

| Variable         | Description                                                     | Required  | Example                                             |
| ---------------- | --------------------------------------------------------------- | --------- | --------------------------------------------------- |
| `MONGO_URI`      | MongoDB Atlas connection string for production/development      | Yes       | `mongodb+srv://user:pass@cluster.mongodb.net/order` |
| `TEST_MONGO_URI` | Local MongoDB connection for testing                            | For tests | `mongodb://localhost:27017/order_test_db`           |
| `JWT_SECRET`     | Secret key for JWT token verification (must match Auth Service) | Yes       | `your_random_secret_key_here`                       |
| `RABBIT_URL`     | RabbitMQ connection URL (AMQP)                                  | Yes       | `amqps://user:pass@host/vhost`                      |

**Important:**

- The `JWT_SECRET` must be identical to the one used in the Auth Service for proper token verification.
- The service connects to Cart Service at `http://localhost:3002`
- The service connects to Product Service at `http://localhost:3001`

## Running the Application

### Development Mode

```bash
# Start with auto-reload using nodemon
npm run dev
```

The server will start on port 3003 with hot-reloading enabled.

### Production Mode

```bash
# Start without auto-reload
npm start
```

### Verify Service is Running

```bash
# Test health endpoint
curl http://localhost:3003/

# Expected response:
# {"message": "Order service is running"}
```

**Console Output on Successful Start:**

```
Connected to RabbitMQ
Order service is running on port 3003
```

## API Endpoints

### Create Order

```
POST /api/orders
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "pincode": "10001",
    "country": "USA"
  }
}
```

**Validation Rules:**

- All address fields are required
- Cart must have items
- All products must have sufficient stock

**Response:** `201 Created`

```json
{
  "order": {
    "_id": "order_id",
    "user": "user_id",
    "items": [
      {
        "product": "product_id",
        "quantity": 2,
        "price": {
          "amount": 199.98,
          "currency": "PKR"
        }
      }
    ],
    "status": "PENDING",
    "totalPrice": {
      "amount": 199.98,
      "currency": "PKR"
    },
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    },
    "createdAt": "2026-01-02T...",
    "updatedAt": "2026-01-02T..."
  }
}
```

**Error Responses:**

- `400 Bad Request` - Cart is empty
- `400 Bad Request` - Product out of stock
- `500 Internal Server Error` - Server error

**Behavior:**

1. Fetches user's cart from Cart Service
2. Retrieves product details for all cart items
3. Validates stock availability for each product
4. Calculates total price from product prices
5. Creates order with PENDING status
6. Publishes order event to RabbitMQ
7. Returns created order

---

### Get My Orders

```
GET /api/orders/me
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**

```
GET /api/orders/me?page=2&limit=20
```

**Response:** `200 OK`

```json
{
  "orders": [
    {
      "_id": "order_id",
      "user": "user_id",
      "items": [...],
      "status": "PENDING",
      "totalPrice": {
        "amount": 199.98,
        "currency": "PKR"
      },
      "shippingAddress": {...},
      "createdAt": "2026-01-02T...",
      "updatedAt": "2026-01-02T..."
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

---

### Get Order By ID

```
GET /api/orders/:id
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**URL Parameters:**

- `id`: The MongoDB ObjectId of the order

**Roles:** `user`, `admin`

**Response:** `200 OK`

```json
{
  "order": {
    "_id": "order_id",
    "user": "user_id",
    "items": [...],
    "status": "PENDING",
    "totalPrice": {
      "amount": 199.98,
      "currency": "PKR"
    },
    "shippingAddress": {...},
    "createdAt": "2026-01-02T...",
    "updatedAt": "2026-01-02T..."
  }
}
```

**Error Responses:**

- `404 Not Found` - Order not found
- `403 Forbidden` - Not authorized to access this order

**Authorization:**

- Users can only access their own orders
- Admins can access any order

---

### Cancel Order

```
POST /api/orders/:id/cancel
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**URL Parameters:**

- `id`: The MongoDB ObjectId of the order

**Response:** `200 OK`

```json
{
  "order": {
    "_id": "order_id",
    "status": "CANCELLED",
    ...
  }
}
```

**Error Responses:**

- `404 Not Found` - Order not found
- `403 Forbidden` - Not authorized to access this order
- `409 Conflict` - Order cannot be cancelled at this stage (not PENDING)

**Restrictions:**

- Only PENDING orders can be cancelled
- Users can only cancel their own orders

---

### Update Order Address

```
PATCH /api/orders/:id/address
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**URL Parameters:**

- `id`: The MongoDB ObjectId of the order

**Request Body:**

```json
{
  "shippingAddress": {
    "street": "456 New St",
    "city": "Los Angeles",
    "state": "CA",
    "pincode": "90001",
    "country": "USA"
  }
}
```

**Validation Rules:**

- All address fields are required

**Response:** `200 OK`

```json
{
  "order": {
    "_id": "order_id",
    "shippingAddress": {
      "street": "456 New St",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001",
      "country": "USA"
    },
    ...
  }
}
```

**Error Responses:**

- `404 Not Found` - Order not found
- `403 Forbidden` - Not authorized to access this order
- `409 Conflict` - Order address cannot be updated at this stage (not PENDING)

**Restrictions:**

- Only PENDING orders can have address updated
- Users can only update their own orders

---

### Health Check

```
GET /
```

**Response:** `200 OK`

```json
{
  "message": "Order service is running"
}
```

## Testing

This project uses **local MongoDB** for testing to save system resources.

### Start MongoDB

```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or run mongod directly
mongod
```

### Run Tests

```bash
# Run all tests
npm test

# Run in development mode
npm run dev
```

### Test Coverage

The test suite includes:

- **createOrder.test.js** - Order creation functionality
- **getMyOrder.test.js** - Get user orders with pagination
- **getOrderById.test.js** - Get specific order by ID
- **cancelOrder.test.js** - Cancel pending orders
- **updateAddress.test.js** - Update shipping address

## Database Schema

### Order Model

```javascript
{
  user: {
    type: ObjectId,
    required: true,
    // Reference to user ID from Auth Service
  },
  items: [
    {
      product: {
        type: ObjectId,
        required: true,
        // Reference to product ID from Product Service
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1
      },
      price: {
        amount: Number,
        currency: String  // "USD" or "PKR"
      }
    }
  ],
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "CANCELLED", "SHIPPED", "DELIVERED"]
  },
  totalPrice: {
    amount: Number,
    currency: String  // "USD" or "PKR"
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  timestamps: true  // Adds createdAt and updatedAt
}
```

**Indexes:**

- `user`: Indexed for fast order lookups by user
- `status`: Indexed for filtering by order status

## Message Broker Events

### Published Events

The Order Service publishes the following events to RabbitMQ:

#### Order Created Event

**Queue:** `ORDER_SELLER_DASHBOARD.ORDER_CREATED`

**Payload:**

```json
{
  "_id": "order_id",
  "user": "user_id",
  "items": [
    {
      "product": "product_id",
      "quantity": 2,
      "price": {
        "amount": 199.98,
        "currency": "PKR"
      }
    }
  ],
  "status": "PENDING",
  "totalPrice": {
    "amount": 199.98,
    "currency": "PKR"
  },
  "shippingAddress": {...},
  "createdAt": "2026-01-02T...",
  "updatedAt": "2026-01-02T..."
}
```

**Purpose:** Notifies Seller Dashboard Service of new order for analytics and tracking

## Middleware

### Authentication Middleware

Role-based authentication middleware that validates JWT tokens.

**Features:**

- Accepts token from cookies or Authorization header
- Verifies token with JWT_SECRET
- Checks user role (user or admin)
- Attaches decoded user data to `req.user`

**Usage:**

```javascript
router.get("/orders", createAuthMiddleware(["user"]), controller);
router.get("/orders/:id", createAuthMiddleware(["user", "admin"]), controller);
```

**Response Codes:**

- `401 Unauthorized` - No token provided
- `401 Unauthorized` - Invalid token
- `403 Forbidden` - Insufficient permissions (wrong role)

### Validation Middleware

Input validation using express-validator.

**Available Validations:**

- `createOrderValidation` - Validates shipping address fields
- `updateAddressValidation` - Validates updated address fields

## Docker Deployment

### Build Docker Image

```bash
# From project root
docker build -t supernova-order:latest ./order

# Or from order directory
cd order
docker build -t supernova-order:latest .
```

### Run Docker Container

```bash
docker run -d \
  -p 3003:3003 \
  -e MONGO_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  -e RABBIT_URL=your_rabbitmq_url \
  --name order-service \
  supernova-order:latest
```

### Docker Compose

```yaml
order:
  build: ./order
  ports:
    - "3003:3003"
  environment:
    - MONGO_URI=${MONGO_URI}
    - JWT_SECRET=${JWT_SECRET}
    - RABBIT_URL=${RABBIT_URL}
  depends_on:
    - auth
    - cart
    - product
    - rabbitmq
```

## Service Dependencies

The Order Service integrates with:

- **Auth Service** (port 3000): For JWT token generation and validation
- **Cart Service** (port 3002): Fetches user's cart items
- **Product Service** (port 3001): Retrieves product details and validates stock
- **Seller Dashboard** (port 3007): Receives order events via RabbitMQ
- **RabbitMQ**: Message broker for event publishing

## Service Integration Flow

### Order Creation Flow

```
1. User clicks "Place Order" on frontend
2. Frontend sends request to Order Service
3. Order Service fetches cart from Cart Service
4. Order Service fetches product details from Product Service
5. Order Service validates stock for all products
6. Order Service calculates total price
7. Order Service creates order in database
8. Order Service publishes event to RabbitMQ
9. Seller Dashboard receives and processes event
10. Order Service returns created order to frontend
```

## Business Logic Details

### Order Creation Logic

1. Authenticate user via JWT token
2. Fetch user's cart from Cart Service
3. Validate cart is not empty
4. For each cart item:
   - Fetch product details from Product Service
   - Validate stock availability
   - Calculate item total (price × quantity)
5. Calculate order total price
6. Create order with PENDING status
7. Publish order event to RabbitMQ
8. Return created order

### Stock Validation

- Checks if `product.stock >= item.quantity`
- Throws error if insufficient stock
- Prevents order creation if any item is out of stock

### Price Calculation

- Uses product prices from Product Service
- Calculates per-item total: `product.price.amount × item.quantity`
- Sums all item totals for order total
- Stores currency from product data (default: PKR)

### Order Status Flow

```
PENDING → CONFIRMED → SHIPPED → DELIVERED
   ↓
CANCELLED (only from PENDING)
```

## Error Handling

**Common Error Responses:**

```json
// Cart Empty
{
  "message": "Cart is empty"
}

// Product Out of Stock
{
  "message": "Product Laptop is out of stock or insufficient stock"
}

// Order Not Found
{
  "message": "Order not found"
}

// Unauthorized Access
{
  "message": "Forbidden: You do not have access to this order"
}

// Cannot Cancel
{
  "message": "Order cannot be cancelled at this stage"
}

// Cannot Update Address
{
  "message": "Order address cannot be updated at this stage"
}

// Authentication Error
{
  "message": "Unauthorized: No token provided"
}

// Validation Error
{
  "errors": [
    {
      "msg": "Street is required",
      "param": "shippingAddress.street"
    }
  ]
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

**Cart Service Connection Error:**

```
Error: connect ECONNREFUSED 127.0.0.1:3002
```

**Solutions:**

- Ensure Cart Service is running on port 3002
- Check Cart Service is accessible
- Verify network connectivity

**Product Service Connection Error:**

```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Solutions:**

- Ensure Product Service is running on port 3001
- Check Product Service is accessible
- Verify network connectivity

**JWT Verification Failed:**

```
Unauthorized: Invalid token
```

**Solutions:**

- Ensure JWT_SECRET matches Auth Service
- Check token is being sent correctly
- Verify token hasn't expired

**Stock Validation Error:**

```
Product X is out of stock or insufficient stock
```

**Solutions:**

- Check product stock in Product Service
- Update product stock if needed
- Reduce quantity in cart

**RabbitMQ Connection Error:**

```
Error connecting to RabbitMQ
```

**Solutions:**

- Verify RABBIT_URL is correct
- Check CloudAMQP instance is active
- Ensure credentials are correct

## Performance Considerations

- Efficient queries using user ID index
- Pagination for order listing
- Parallel product detail fetching
- Async/await for non-blocking operations
- Connection pooling for MongoDB
- Service-to-service communication with Axios

## Security Features

- JWT token verification
- Role-based access control (user, admin)
- Owner verification for order access
- Input validation and sanitization
- HTTP-only cookie support
- Bearer token support
- Protected endpoints
- Stock validation to prevent overselling

## Best Practices

- Always authenticate before order operations
- Validate shipping address completeness
- Check stock availability before order creation
- Only allow cancellation of PENDING orders
- Only allow address updates for PENDING orders
- Verify order ownership before modifications
- Use pagination for order listings
- Log all order state changes
- Publish events for order tracking

## Usage Example

### Complete Order Flow

```javascript
// 1. Login to get JWT token (Auth Service)
const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com", password: "password123" }),
});
const token = loginResponse.headers.get("set-cookie");

// 2. Add items to cart (Cart Service)
await fetch("http://localhost:3002/api/cart/items", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: token,
  },
  body: JSON.stringify({
    productId: "507f1f77bcf86cd799439011",
    qty: 2,
  }),
});

// 3. Create order (Order Service)
const orderResponse = await fetch("http://localhost:3003/api/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: token,
  },
  body: JSON.stringify({
    shippingAddress: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      pincode: "10001",
      country: "USA",
    },
  }),
});
const { order } = await orderResponse.json();

// 4. Get order details
const detailResponse = await fetch(
  `http://localhost:3003/api/orders/${order._id}`,
  {
    headers: { Cookie: token },
  }
);

// 5. Update shipping address (if needed)
await fetch(`http://localhost:3003/api/orders/${order._id}/address`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Cookie: token,
  },
  body: JSON.stringify({
    shippingAddress: {
      street: "456 New St",
      city: "Los Angeles",
      state: "CA",
      pincode: "90001",
      country: "USA",
    },
  }),
});

// 6. Cancel order (if needed)
await fetch(`http://localhost:3003/api/orders/${order._id}/cancel`, {
  method: "POST",
  headers: { Cookie: token },
});
```

## Future Enhancements

- Order tracking system
- Payment gateway integration
- Inventory management updates
- Order confirmation emails
- Shipment tracking
- Return and refund handling
- Order history export
- Multi-currency support
- Tax calculation
- Discount codes/coupons

## License

ISC
