# Cart Service

Shopping cart management service for the SUPER-NOVA e-commerce platform. Handles cart operations including adding items, updating quantities, and retrieving user carts with persistent storage.

## Overview

The Cart Service is a microservice that provides:

- User-specific shopping cart management
- Add products to cart with quantity
- Update item quantities in cart
- Retrieve cart with item totals
- Automatic cart creation for new users
- JWT-based authentication with role validation
- Persistent cart storage in MongoDB

## Architecture

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas for production, local for testing)
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest with Supertest
- **Validation**: Express-validator

## Features

### Cart Management

- Get user's cart with totals (item count, total quantity)
- Add new items to cart
- Update existing item quantities
- Automatic cart creation if doesn't exist
- Duplicate item handling (increments quantity)

### Security

- JWT token authentication (cookie or header-based)
- Role-based access control (user role required)
- Protected routes with auth middleware
- Input validation for all operations

### Data Persistence

- MongoDB storage for carts
- Automatic timestamps (createdAt, updatedAt)
- Efficient queries by user ID

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (for production) OR local MongoDB
- Local MongoDB (for testing - must be installed and running)
- Running Auth Service (for JWT token generation)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root of the cart directory:

```env
# Production/Development Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/cart?retryWrites=true&w=majority

# Test Database (Local MongoDB)
TEST_MONGO_URI=mongodb://localhost:27017/cart_test_db

# JWT Secret (must match Auth Service)
JWT_SECRET=your_secret_key_here
```

### Environment Variable Details

| Variable         | Description                                                     | Required  | Example                                            |
| ---------------- | --------------------------------------------------------------- | --------- | -------------------------------------------------- |
| `MONGO_URI`      | MongoDB Atlas connection string for production/development      | Yes       | `mongodb+srv://user:pass@cluster.mongodb.net/cart` |
| `TEST_MONGO_URI` | Local MongoDB connection for testing                            | For tests | `mongodb://localhost:27017/cart_test_db`           |
| `JWT_SECRET`     | Secret key for JWT token verification (must match Auth Service) | Yes       | `your_random_secret_key_here`                      |

**Important:** The `JWT_SECRET` must be identical to the one used in the Auth Service for proper token verification.

## Running the Application

### Development Mode

```bash
# Start with auto-reload using nodemon
npm run dev
```

The server will start on port 3002 with hot-reloading enabled.

### Production Mode

```bash
# Start without auto-reload
npm start
```

### Verify Service is Running

```bash
# Test health endpoint
curl http://localhost:3002/

# Expected response:
# {"message": "Cart service is running"}
```

## API Endpoints

### Get User Cart

```
GET /api/cart
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`

```json
{
  "cart": {
    "_id": "...",
    "user": "user_id",
    "items": [
      {
        "productId": "product_id",
        "quantity": 2,
        "_id": "item_id"
      }
    ],
    "createdAt": "2026-01-02T...",
    "updatedAt": "2026-01-02T..."
  },
  "totals": {
    "itemCount": 1,
    "totalQuantity": 2
  }
}
```

**Behavior:**

- If cart doesn't exist, creates empty cart automatically
- Returns cart with computed totals

---

### Add Item to Cart

```
POST /api/cart/items
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
  "productId": "507f1f77bcf86cd799439011",
  "qty": 2
}
```

**Validation Rules:**

- `productId`: Required, must be valid MongoDB ObjectId
- `qty`: Required, must be positive integer

**Response:** `200 OK`

```json
{
  "message": "Item added to cart",
  "cart": {
    "_id": "...",
    "user": "user_id",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "quantity": 2,
        "_id": "item_id"
      }
    ],
    "createdAt": "2026-01-02T...",
    "updatedAt": "2026-01-02T..."
  }
}
```

**Behavior:**

- If item already exists in cart, quantity is added to existing quantity
- If item doesn't exist, new item is added
- Creates cart if doesn't exist

---

### Update Item Quantity

```
PATCH /api/cart/items/:productId
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**URL Parameters:**

- `productId`: The MongoDB ObjectId of the product

**Request Body:**

```json
{
  "qty": 5
}
```

**Validation Rules:**

- `qty`: Required, must be positive integer

**Response:** `200 OK`

```json
{
  "message": "Item updated",
  "cart": {
    "_id": "...",
    "user": "user_id",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "quantity": 5,
        "_id": "item_id"
      }
    ]
  }
}
```

**Error Responses:**

- `404 Not Found` - Cart not found
- `404 Not Found` - Item not found in cart

---

### Health Check

```
GET /
```

**Response:** `200 OK`

```json
{
  "message": "Cart service is running"
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

# Run tests in watch mode (if configured)
npm run test:watch
```

### Test Coverage

The test suite includes:

- **cart.get.test.js** - Get cart functionality
- **cart.items.post.test.js** - Add items to cart
- **cart.items.patch.test.js** - Update item quantities

## Database Schema

### Cart Model

```javascript
{
  user: {
    type: ObjectId,
    required: true,
    // Reference to user ID from Auth Service
  },
  items: [
    {
      productId: {
        type: ObjectId,
        required: true,
        // Reference to product ID from Product Service
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],
  timestamps: true  // Adds createdAt and updatedAt
}
```

**Indexes:**

- `user`: Indexed for fast cart lookups by user

## Middleware

### Authentication Middleware

Role-based authentication middleware that validates JWT tokens.

**Features:**

- Accepts token from cookies or Authorization header
- Verifies token with JWT_SECRET
- Checks user role (must be "user")
- Attaches decoded user data to `req.user`

**Usage:**

```javascript
router.get("/cart", createAuthMiddleware(["user"]), controller);
```

**Response Codes:**

- `401 Unauthorized` - No token provided
- `401 Unauthorized` - Invalid token
- `403 Forbidden` - Insufficient permissions (wrong role)

### Validation Middleware

Input validation using express-validator.

**Available Validations:**

- `validateAddItemToCart` - Validates productId and qty
- `validateUpdateCartItem` - Validates qty parameter

## Docker Deployment

### Build Docker Image

```bash
# From project root
docker build -t supernova-cart:latest ./cart

# Or from cart directory
cd cart
docker build -t supernova-cart:latest .
```

### Run Docker Container

```bash
docker run -d \
  -p 3002:3002 \
  -e MONGO_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  --name cart-service \
  supernova-cart:latest
```

### Docker Compose

```yaml
cart:
  build: ./cart
  ports:
    - "3002:3002"
  environment:
    - MONGO_URI=${MONGO_URI}
    - JWT_SECRET=${JWT_SECRET}
  depends_on:
    - auth
```

## Service Dependencies

The Cart Service integrates with:

- **Auth Service** (port 3000): For JWT token generation and validation
- **Product Service** (port 3006): Product IDs reference products (not enforced by foreign key)
- **Order Service** (port 3004): Cart data used during checkout

## Usage Example

### Complete Cart Flow

```javascript
// 1. Login to get JWT token (Auth Service)
const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com", password: "password123" }),
});
const token = loginResponse.headers.get("set-cookie"); // Extract token

// 2. Get cart (creates if doesn't exist)
const cartResponse = await fetch("http://localhost:3002/api/cart", {
  headers: { Cookie: token },
});
const { cart, totals } = await cartResponse.json();

// 3. Add item to cart
const addResponse = await fetch("http://localhost:3002/api/cart/items", {
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

// 4. Update item quantity
const updateResponse = await fetch(
  "http://localhost:3002/api/cart/items/507f1f77bcf86cd799439011",
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: token,
    },
    body: JSON.stringify({ qty: 5 }),
  }
);
```

## Business Logic

### Add Item Logic

1. Find or create user's cart
2. Check if product already exists in cart
3. If exists: increment quantity by `qty`
4. If not exists: add new item with `qty`
5. Save cart and return updated cart

### Update Quantity Logic

1. Find user's cart
2. Find item by productId
3. Update item quantity to new value
4. Save cart and return updated cart

### Cart Totals

- `itemCount`: Number of unique products in cart
- `totalQuantity`: Sum of all quantities

## Error Handling

**Common Error Responses:**

```json
// Authentication Error
{
  "message": "Unauthorized: No token provided"
}

// Role Permission Error
{
  "message": "Forbidden: Insufficient permissions"
}

// Validation Error
{
  "errors": [
    {
      "msg": "Product ID is required",
      "param": "productId"
    }
  ]
}

// Cart Not Found
{
  "message": "Cart not found"
}

// Item Not Found
{
  "message": "Item not found"
}
```

## Troubleshooting

### Common Issues

**MongoDB Connection Error:**

```
Error: connect ECONNREFUSED
```

- Verify MONGO_URI is correct
- Check network access in MongoDB Atlas
- Ensure IP whitelist includes your IP

**JWT Verification Failed:**

```
Unauthorized: Invalid token
```

- Ensure JWT_SECRET matches Auth Service
- Check token is being sent correctly
- Verify token hasn't expired

**Forbidden Error:**

```
Forbidden: Insufficient permissions
```

- Ensure logged-in user has "user" role
- Token must contain valid role field

**Item Not Found:**

```
Item not found
```

- Verify productId exists in cart
- Check productId format (must be valid ObjectId)

## Performance Considerations

- Efficient queries using user ID index
- Atomic updates for cart modifications
- In-memory totals calculation
- Connection pooling for MongoDB
- Async/await for non-blocking operations

## Security Features

- JWT token verification
- Role-based access control (user role only)
- Input validation and sanitization
- HTTP-only cookie support
- Bearer token support
- Protected endpoints

## Best Practices

- Always authenticate before cart operations
- Validate product IDs before adding to cart
- Use positive integers for quantities
- Handle duplicate items by incrementing quantity
- Create carts lazily (on first access)

## License

ISC
