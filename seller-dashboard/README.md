# Seller Dashboard Service

Analytics and reporting service for sellers in the SUPER-NOVA e-commerce platform. Provides real-time metrics, sales tracking, order management, and product analytics through event-driven data synchronization.

## Overview

The Seller Dashboard Service is a microservice that provides:

- Real-time sales metrics and analytics
- Revenue tracking and calculations
- Top-selling products analysis
- Order management filtered by seller
- Product listing for sellers
- Event-driven data synchronization via RabbitMQ
- Seller-specific performance insights
- JWT-based authentication
- Separate database for dashboard data

## Architecture

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (separate from main product/order databases)
- **Message Broker**: RabbitMQ (CloudAMQP) - Consumer
- **Authentication**: JWT (JSON Web Tokens)
- **Event Processing**: AMQP message consumption

### Data Flow

1. **Event Consumption:** Listen to 5 RabbitMQ queues
2. **Data Synchronization:** Store data in dashboard database
3. **Metrics Calculation:** Aggregate sales, revenue, top products
4. **API Delivery:** Serve analytics via authenticated endpoints

## Features

### Analytics & Metrics

- **Sales Metrics:** Total order count for seller
- **Revenue Calculation:** Sum of all confirmed payments
- **Top Products:** Top 5 products by quantity sold
- **Real-time Updates:** Automatic sync via message broker

### Order Management

- View all orders containing seller's products
- Filter orders by seller's product IDs
- Complete order details with products array

### Product Tracking

- List all seller's products
- Product creation timestamps
- Product details synced from Product Service

### Event-Driven Architecture

- **5 RabbitMQ Queues:**
  1. User created events (from Auth Service)
  2. Product created events (from Product Service)
  3. Order created events (from Order Service)
  4. Payment created events (from Payment Service)
  5. Payment status updates (from Payment Service)

### Security

- JWT token authentication
- Seller-specific data isolation
- Role-based access control
- Secure message broker connections

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Running Auth Service (for JWT token generation)
- Running RabbitMQ instance (CloudAMQP or local)
- Running Product, Order, Payment services (for event publishing)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root of the seller-dashboard directory:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/seller_dashboard?retryWrites=true&w=majority

# JWT Secret (must match Auth Service)
JWT_SECRET=your_secret_key_here

# RabbitMQ Configuration
RABBIT_URL=amqps://username:password@your-rabbitmq-host/vhost

# Server Port (optional, defaults to 3007)
PORT=3007
```

### Environment Variable Details

| Variable     | Description                                                     | Required | Example                                                        |
| ------------ | --------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| `MONGO_URI`  | MongoDB connection string for seller dashboard database         | Yes      | `mongodb+srv://user:pass@cluster.mongodb.net/seller_dashboard` |
| `JWT_SECRET` | Secret key for JWT token verification (must match Auth Service) | Yes      | `your_random_secret_key_here`                                  |
| `RABBIT_URL` | RabbitMQ connection URL (AMQP protocol)                         | Yes      | `amqps://user:pass@host/vhost`                                 |
| `PORT`       | Server port number (default: 3007)                              | No       | `3007`                                                         |

### Database Structure

The Seller Dashboard uses a **separate MongoDB database** (`seller_dashboard`) to store synced data:

**Collections:**

- `users` - User data synced from Auth Service
- `products` - Product data synced from Product Service
- `orders` - Order data synced from Order Service
- `payments` - Payment data synced from Payment Service

**Benefits:**

- Independent scaling
- Optimized for read-heavy operations
- No impact on transactional services
- Faster analytics queries

## Running the Application

### Development Mode

```bash
# Start with auto-reload
npm run dev
```

### Production Mode

```bash
# Start without auto-reload
npm start
```

### Verify Service is Running

```bash
# Test health endpoint
curl http://localhost:3007/

# Expected response:
# {"message": "Seller Dashboard service is running"}
```

**Console Output on Successful Start:**

```
Connected to RabbitMQ
Listening to queue: AUTH_SELLER_DASHBOARD.USER_CREATED
Listening to queue: PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED
Listening to queue: ORDER_SELLER_DASHBOARD.ORDER_CREATED
Listening to queue: PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED
Listening to queue: PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE
Seller Dashboard service is running on port 3007
```

## API Endpoints

### Get Seller Metrics

```
GET /api/seller/metrics
```

**Description:** Retrieve comprehensive analytics for the authenticated seller.

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**Roles:** `seller`

**Response:** `200 OK`

```json
{
  "data": {
    "sales": 45,
    "revenue": 3450000,
    "topProducts": [
      {
        "_id": "product_id_1",
        "title": "Gaming Laptop",
        "totalQuantity": 15
      },
      {
        "_id": "product_id_2",
        "title": "Wireless Mouse",
        "totalQuantity": 12
      },
      {
        "_id": "product_id_3",
        "title": "Mechanical Keyboard",
        "totalQuantity": 10
      },
      {
        "_id": "product_id_4",
        "title": "USB-C Hub",
        "totalQuantity": 5
      },
      {
        "_id": "product_id_5",
        "title": "Laptop Stand",
        "totalQuantity": 3
      }
    ]
  }
}
```

**Metrics Explained:**

- **sales:** Total number of orders containing seller's products
- **revenue:** Sum of all payments with status "COMPLETED" for seller's orders
- **topProducts:** Top 5 best-selling products by quantity sold (aggregated from order items)

**Example cURL:**

```bash
curl http://localhost:3007/api/seller/metrics \
  -H "Cookie: token=your_jwt_token"
```

---

### Get Seller Orders

```
GET /api/seller/orders
```

**Description:** Get all orders containing the authenticated seller's products.

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**Roles:** `seller`

**Response:** `200 OK`

```json
{
  "data": [
    {
      "_id": "order_id",
      "user": "user_id",
      "products": [
        {
          "product": "product_id",
          "title": "Gaming Laptop",
          "quantity": 1,
          "price": {
            "amount": 120000,
            "currency": "PKR"
          },
          "seller": "current_seller_id"
        }
      ],
      "totalPrice": {
        "amount": 120000,
        "currency": "PKR"
      },
      "status": "CONFIRMED",
      "address": {
        "street": "123 Main St",
        "city": "Lahore",
        "state": "Punjab",
        "postalCode": "54000",
        "country": "Pakistan"
      },
      "createdAt": "2026-01-02T...",
      "updatedAt": "2026-01-02T..."
    }
  ]
}
```

**Filtering Logic:**

- Returns orders where at least one product belongs to the seller
- Products array may contain items from multiple sellers
- Only orders with seller's products are included

**Example cURL:**

```bash
curl http://localhost:3007/api/seller/orders \
  -H "Cookie: token=your_jwt_token"
```

---

### Get Seller Products

```
GET /api/seller/products
```

**Description:** Get all products belonging to the authenticated seller.

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**Roles:** `seller`

**Response:** `200 OK`

```json
{
  "data": [
    {
      "_id": "product_id",
      "title": "Gaming Laptop",
      "description": "High performance gaming laptop",
      "price": {
        "amount": 120000,
        "currency": "PKR"
      },
      "seller": "current_seller_id",
      "images": [
        {
          "url": "https://ik.imagekit.io/xxx/products/uuid.jpg",
          "thumbnail": "https://ik.imagekit.io/xxx/products/tr:w-200/uuid.jpg",
          "id": "imagekit_file_id"
        }
      ],
      "stock": 10,
      "createdAt": "2026-01-02T...",
      "updatedAt": "2026-01-02T..."
    }
  ]
}
```

**Data Source:**

- Products synced from Product Service via RabbitMQ
- Stored in dashboard's own product collection
- Real-time updates when new products are created

**Example cURL:**

```bash
curl http://localhost:3007/api/seller/products \
  -H "Cookie: token=your_jwt_token"
```

---

### Health Check

```
GET /
```

**Response:** `200 OK`

```json
{
  "message": "Seller Dashboard service is running"
}
```

## Database Schema

### User Model

```javascript
{
  _id: ObjectId,           // User ID from Auth Service
  name: String,
  email: String,
  role: String,            // "user", "seller", "admin"
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model

```javascript
{
  _id: ObjectId,           // Product ID from Product Service
  title: String,
  description: String,
  price: {
    amount: Number,
    currency: String       // "USD", "PKR"
  },
  seller: ObjectId,        // Reference to seller user ID
  images: [
    {
      url: String,
      thumbnail: String,
      id: String
    }
  ],
  stock: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model

```javascript
{
  _id: ObjectId,           // Order ID from Order Service
  user: ObjectId,          // Customer user ID
  products: [
    {
      product: ObjectId,   // Product ID
      title: String,
      quantity: Number,
      price: {
        amount: Number,
        currency: String
      },
      seller: ObjectId     // Seller user ID
    }
  ],
  totalPrice: {
    amount: Number,
    currency: String
  },
  status: String,          // "PENDING", "CONFIRMED", "CANCELLED", etc.
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Model

```javascript
{
  _id: ObjectId,           // Payment ID from Payment Service
  order: ObjectId,         // Order ID
  user: ObjectId,          // User ID
  amount: Number,
  currency: String,
  status: String,          // "PENDING", "COMPLETED", "FAILED"
  transactionId: String,   // JazzCash transaction ID
  createdAt: Date,
  updatedAt: Date
}
```

## RabbitMQ Event Listeners

### 1. User Created Event

**Queue:** `AUTH_SELLER_DASHBOARD.USER_CREATED`

**Event Source:** Auth Service

**Payload:**

```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "seller",
  "createdAt": "2026-01-02T...",
  "updatedAt": "2026-01-02T..."
}
```

**Action:**

- Creates or updates user in dashboard database
- Uses upsert operation (update if exists, create if not)

---

### 2. Product Created Event

**Queue:** `PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED`

**Event Source:** Product Service

**Payload:**

```json
{
  "_id": "product_id",
  "title": "Gaming Laptop",
  "description": "High performance gaming laptop",
  "price": {
    "amount": 120000,
    "currency": "PKR"
  },
  "seller": "seller_id",
  "images": [...],
  "stock": 10,
  "createdAt": "2026-01-02T...",
  "updatedAt": "2026-01-02T..."
}
```

**Action:**

- Creates or updates product in dashboard database
- Uses upsert operation

---

### 3. Order Created Event

**Queue:** `ORDER_SELLER_DASHBOARD.ORDER_CREATED`

**Event Source:** Order Service

**Payload:**

```json
{
  "_id": "order_id",
  "user": "user_id",
  "products": [
    {
      "product": "product_id",
      "title": "Gaming Laptop",
      "quantity": 1,
      "price": {...},
      "seller": "seller_id"
    }
  ],
  "totalPrice": {...},
  "status": "PENDING",
  "address": {...},
  "createdAt": "2026-01-02T...",
  "updatedAt": "2026-01-02T..."
}
```

**Action:**

- Creates or updates order in dashboard database
- Used for sales metrics and order listing

---

### 4. Payment Created Event

**Queue:** `PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED`

**Event Source:** Payment Service

**Payload:**

```json
{
  "_id": "payment_id",
  "order": "order_id",
  "user": "user_id",
  "amount": 120000,
  "currency": "PKR",
  "status": "PENDING",
  "transactionId": "jazzcash_txn_id",
  "createdAt": "2026-01-02T...",
  "updatedAt": "2026-01-02T..."
}
```

**Action:**

- Creates or updates payment in dashboard database
- Used for revenue calculations

---

### 5. Payment Update Event

**Queue:** `PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE`

**Event Source:** Payment Service

**Payload:**

```json
{
  "_id": "payment_id",
  "order": "order_id",
  "user": "user_id",
  "amount": 120000,
  "currency": "PKR",
  "status": "COMPLETED",
  "transactionId": "jazzcash_txn_id",
  "createdAt": "2026-01-02T...",
  "updatedAt": "2026-01-02T..."
}
```

**Action:**

- Updates payment status in dashboard database
- Critical for accurate revenue tracking
- Status changes: PENDING → COMPLETED or FAILED

## Metrics Calculation Logic

### Sales Count

```javascript
// Count orders where at least one product belongs to seller
const sales = await Order.countDocuments({
  "products.seller": req.user._id,
});
```

**Logic:**

- Searches orders for products array
- Filters by seller ID in product items
- Counts matching orders

---

### Revenue Calculation

```javascript
// Sum amounts from completed payments
const payments = await Payment.find({
  status: "COMPLETED",
});

const orderIds = payments.map((p) => p.order);

const orders = await Order.find({
  _id: { $in: orderIds },
  "products.seller": req.user._id,
});

let revenue = 0;
for (const order of orders) {
  for (const payment of payments) {
    if (payment.order.toString() === order._id.toString()) {
      revenue += payment.amount;
    }
  }
}
```

**Logic:**

1. Find all payments with status "COMPLETED"
2. Get order IDs from payments
3. Filter orders containing seller's products
4. Sum payment amounts for matching orders

---

### Top Products

```javascript
// Aggregate products by quantity sold
const topProducts = await Order.aggregate([
  { $unwind: "$products" },
  { $match: { "products.seller": req.user._id } },
  {
    $group: {
      _id: "$products.product",
      title: { $first: "$products.title" },
      totalQuantity: { $sum: "$products.quantity" },
    },
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 5 },
]);
```

**Logic:**

1. Unwind products array from orders
2. Filter by seller ID
3. Group by product ID
4. Sum quantities for each product
5. Sort by total quantity (descending)
6. Return top 5

## Middleware

### Authentication Middleware

**Purpose:** Validates JWT tokens and ensures user is a seller.

**Features:**

- Accepts token from cookies or Authorization header
- Verifies token with JWT_SECRET
- Checks user role is "seller"
- Attaches decoded user data to `req.user`

**Usage:**

```javascript
router.get("/metrics", createAuthMiddleware(["seller"]), getMetrics);
```

**Response Codes:**

- `401 Unauthorized` - No token provided
- `401 Unauthorized` - Invalid token
- `403 Forbidden` - User is not a seller

## Docker Deployment

### Build Docker Image

```bash
# From project root
docker build -t supernova-seller-dashboard:latest ./seller-dashboard

# Or from seller-dashboard directory
cd seller-dashboard
docker build -t supernova-seller-dashboard:latest .
```

### Run Docker Container

```bash
docker run -d \
  -p 3007:3007 \
  -e MONGO_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  -e RABBIT_URL=your_rabbitmq_url \
  --name seller-dashboard-service \
  supernova-seller-dashboard:latest
```

### Docker Compose

```yaml
seller-dashboard:
  build: ./seller-dashboard
  ports:
    - "3007:3007"
  environment:
    - MONGO_URI=${MONGO_URI}
    - JWT_SECRET=${JWT_SECRET}
    - RABBIT_URL=${RABBIT_URL}
  depends_on:
    - auth
    - product
    - order
    - payment
    - rabbitmq
```

## Service Dependencies

The Seller Dashboard Service integrates with:

- **Auth Service** (port 3001): For JWT token generation and validation, user events
- **Product Service** (port 3001): Receives product events via RabbitMQ
- **Order Service** (port 3004): Receives order events via RabbitMQ
- **Payment Service** (port 3005): Receives payment events via RabbitMQ
- **RabbitMQ**: Message broker for event consumption (5 queues)
- **MongoDB**: Separate database for dashboard data

## Data Synchronization Flow

```
┌─────────────┐
│ Auth Service│──► USER_CREATED ──────────┐
└─────────────┘                            │
                                           │
┌──────────────┐                           │
│Product Service│──► PRODUCT_CREATED ─────┤
└──────────────┘                           │
                                           │
┌─────────────┐                            │    ┌──────────────────┐
│Order Service│──► ORDER_CREATED ─────────┼───►│Seller Dashboard  │
└─────────────┘                            │    │   (Consumer)     │
                                           │    └──────────────────┘
┌───────────────┐                          │              │
│Payment Service│──► PAYMENT_CREATED ─────┤              │
│               │──► PAYMENT_UPDATE ───────┘              │
└───────���───────┘                                         │
                                                          ▼
                                                  ┌───────────────┐
                                                  │   Dashboard   │
                                                  │   Database    │
                                                  └───────────────┘
```

**Process:**

1. Services publish events to RabbitMQ queues
2. Seller Dashboard listens to 5 queues
3. Events consumed and data upserted to dashboard DB
4. API endpoints query dashboard DB for analytics

## Frontend Integration Example

### React Seller Dashboard

```javascript
import React, { useEffect, useState } from "react";

function SellerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch metrics
      const metricsRes = await fetch(
        "http://localhost:3007/api/seller/metrics",
        {
          credentials: "include",
        }
      );
      const metricsData = await metricsRes.json();
      setMetrics(metricsData.data);

      // Fetch orders
      const ordersRes = await fetch("http://localhost:3007/api/seller/orders", {
        credentials: "include",
      });
      const ordersData = await ordersRes.json();
      setOrders(ordersData.data);

      // Fetch products
      const productsRes = await fetch(
        "http://localhost:3007/api/seller/products",
        {
          credentials: "include",
        }
      );
      const productsData = await productsRes.json();
      setProducts(productsData.data);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="seller-dashboard">
      <h1>Seller Dashboard</h1>

      {/* Metrics Section */}
      <div className="metrics">
        <div className="metric-card">
          <h3>Total Sales</h3>
          <p>{metrics.sales}</p>
        </div>
        <div className="metric-card">
          <h3>Total Revenue</h3>
          <p>PKR {metrics.revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="top-products">
        <h2>Top Selling Products</h2>
        {metrics.topProducts.map((product) => (
          <div key={product._id} className="product-item">
            <span>{product.title}</span>
            <span>Sold: {product.totalQuantity}</span>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="orders">
        <h2>Recent Orders</h2>
        {orders.map((order) => (
          <div key={order._id} className="order-item">
            <span>Order ID: {order._id}</span>
            <span>Status: {order.status}</span>
            <span>Total: PKR {order.totalPrice.amount}</span>
          </div>
        ))}
      </div>

      {/* Products List */}
      <div className="products">
        <h2>My Products</h2>
        {products.map((product) => (
          <div key={product._id} className="product-item">
            <span>{product.title}</span>
            <span>Stock: {product.stock}</span>
            <span>Price: PKR {product.price.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SellerDashboard;
```

## Error Handling

**Common Error Responses:**

```json
// Unauthorized
{
  "message": "Unauthorized: No token provided"
}

// Invalid Token
{
  "message": "Unauthorized: Invalid token"
}

// Forbidden (Not a Seller)
{
  "message": "Forbidden: Seller role required"
}

// Internal Server Error
{
  "message": "Internal server error"
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
- Verify database name is correct

**JWT Verification Failed:**

```
Unauthorized: Invalid token
```

**Solutions:**

- Ensure JWT_SECRET matches Auth Service
- Check token is being sent correctly
- Verify user has "seller" role
- Check token hasn't expired

**RabbitMQ Connection Error:**

```
Error connecting to RabbitMQ
```

**Solutions:**

- Verify RABBIT_URL is correct
- Check CloudAMQP instance is active
- Ensure credentials are correct
- Verify virtual host (vhost) is correct

**No Events Being Received:**

```
Queues connected but no data syncing
```

**Solutions:**

- Check other services are publishing events
- Verify queue names match exactly
- Check RabbitMQ dashboard for message count
- Ensure services are using same RabbitMQ instance
- Check queue bindings in RabbitMQ console

**Metrics Showing Zero:**

```
Sales: 0, Revenue: 0
```

**Solutions:**

- Verify events have been consumed
- Check data exists in dashboard database
- Ensure seller ID matches in products/orders
- Verify payment status is "COMPLETED" for revenue
- Check MongoDB collections have data

**Orders Not Showing:**

```
GET /api/seller/orders returns empty array
```

**Solutions:**

- Verify orders contain seller's products
- Check seller ID in order products array
- Ensure ORDER_CREATED events were received
- Check orders collection in dashboard DB

## Performance Considerations

- **Separate Database:** Isolated from transactional services for better performance
- **Aggregation Pipeline:** Efficient top products calculation
- **Message Queue:** Asynchronous data sync doesn't block services
- **Connection Pooling:** Reuses MongoDB connections
- **Upsert Operations:** Prevents duplicate data

## Security Features

- **JWT Authentication:** Secure token-based auth
- **Seller-Only Access:** Role-based access control
- **Data Isolation:** Sellers only see their own data
- **Secure Message Broker:** Encrypted RabbitMQ connections (AMQPS)
- **HTTP-only Cookies:** Secure token storage
- **Bearer Token Support:** Authorization header support

## Best Practices

- Monitor RabbitMQ queue lengths
- Set up alerts for connection failures
- Regularly backup dashboard database
- Index frequently queried fields
- Log all incoming events
- Implement retry logic for failed events
- Cache frequently accessed metrics
- Use pagination for large datasets
- Monitor MongoDB performance

## Future Enhancements

- Historical sales charts and graphs
- Revenue trends over time
- Product performance analytics
- Customer demographics
- Inventory alerts and recommendations
- Export reports (PDF, CSV)
- Real-time WebSocket updates
- Predictive analytics with AI
- Multi-currency revenue conversion
- Comparison with previous periods
- Seller ranking and badges
- Automated insights and suggestions

## Monitoring

**Key Metrics to Monitor:**

- RabbitMQ queue message count
- Event processing rate
- Database query performance
- API response times
- Error rates
- MongoDB connections
- Memory usage
- CPU usage

**Recommended Tools:**

- PM2 for process management
- MongoDB Atlas monitoring
- CloudAMQP dashboard
- New Relic or DataDog for APM
- Winston for logging

## License

ISC
