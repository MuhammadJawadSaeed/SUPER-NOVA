# Product Service

Product catalog management service for the SUPER-NOVA e-commerce platform. Handles product CRUD operations, image uploads via ImageKit, product search with filters, and seller-specific product management.

## Overview

The Product Service is a microservice that provides:

- Complete product CRUD operations (Create, Read, Update, Delete)
- Image upload and management with ImageKit CDN
- Product search with text search and price filters
- Seller-specific product management
- Stock inventory tracking
- Multi-currency support (USD, PKR)
- JWT-based authentication with role validation
- Event publishing to message broker
- Comprehensive test coverage

## Architecture

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas for production, local for testing)
- **Image Storage**: ImageKit CDN
- **File Upload**: Multer (multipart/form-data)
- **Message Broker**: RabbitMQ (CloudAMQP)
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest with Supertest
- **Validation**: Express-validator

## Features

### Product Management

- Create products with multiple images (up to 5)
- Update product details (title, description, price)
- Delete products (seller can only delete their own)
- Get all products with pagination
- Get product by ID
- Get seller's own products
- Stock inventory management

### Image Handling

- Upload multiple product images
- Automatic image optimization via ImageKit
- Thumbnail generation
- CDN delivery for fast loading
- Unique file naming with UUID

### Search & Filtering

- Full-text search on title and description
- Price range filtering (min/max)
- Pagination support
- Limit results per query

### Security

- Role-based access control (admin, seller)
- Sellers can only modify their own products
- JWT token authentication
- Input validation on all operations

### Event Publishing

- Product creation events to Seller Dashboard
- Product notifications for new launches
- Real-time sync across services

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (for production) OR local MongoDB
- Local MongoDB (for testing - must be installed and running)
- ImageKit account with API credentials
- Running Auth Service (for JWT token generation)
- RabbitMQ instance (CloudAMQP or local)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root of the product directory:

```env
# Production/Development Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/product?retryWrites=true&w=majority

# Test Database (Local MongoDB)
TEST_MONGO_URI=mongodb://localhost:27017/product_test_db

# JWT Secret (must match Auth Service)
JWT_SECRET=your_secret_key_here

# Redis Configuration (optional, for caching)
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# RabbitMQ Configuration
RABBIT_URL=amqps://username:password@your-rabbitmq-host/vhost
```

### Environment Variable Details

| Variable                | Description                                                     | Required  | Example                                               |
| ----------------------- | --------------------------------------------------------------- | --------- | ----------------------------------------------------- |
| `MONGO_URI`             | MongoDB Atlas connection string for production/development      | Yes       | `mongodb+srv://user:pass@cluster.mongodb.net/product` |
| `TEST_MONGO_URI`        | Local MongoDB connection for testing                            | For tests | `mongodb://localhost:27017/product_test_db`           |
| `JWT_SECRET`            | Secret key for JWT token verification (must match Auth Service) | Yes       | `your_random_secret_key_here`                         |
| `REDIS_HOST`            | Redis server hostname (optional for caching)                    | No        | `redis-14955.cloud.redislabs.com`                     |
| `REDIS_PORT`            | Redis server port                                               | No        | `14955`                                               |
| `REDIS_PASSWORD`        | Redis authentication password                                   | No        | `your_redis_password`                                 |
| `IMAGEKIT_PUBLIC_KEY`   | ImageKit public API key                                         | Yes       | `public_xxxxxxxxxxxxx`                                |
| `IMAGEKIT_PRIVATE_KEY`  | ImageKit private API key                                        | Yes       | `private_xxxxxxxxxxxxx`                               |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit CDN URL endpoint                                       | Yes       | `https://ik.imagekit.io/your_id`                      |
| `RABBIT_URL`            | RabbitMQ connection URL (AMQP)                                  | Yes       | `amqps://user:pass@host/vhost`                        |

### Getting ImageKit Credentials

1. **Create ImageKit Account:**

   - Visit [ImageKit.io](https://imagekit.io/)
   - Sign up for free account
   - Verify email

2. **Get API Credentials:**

   - Login to ImageKit Dashboard
   - Go to "Developer Options" > "API Keys"
   - Copy Public Key
   - Copy Private Key
   - Copy URL Endpoint

3. **Configure Settings:**
   - Set up folders (e.g., `/products`)
   - Configure image optimization settings
   - Enable automatic format conversion

**ImageKit Free Tier:**

- 20 GB bandwidth/month
- 20 GB storage
- Unlimited image transformations

## Running the Application

### Development Mode

```bash
# Start with auto-reload using nodemon
npm run dev
```

The server will start on port 3001 with hot-reloading enabled.

### Production Mode

```bash
# Start without auto-reload
npm start
```

### Verify Service is Running

```bash
# Test health endpoint
curl http://localhost:3001/

# Expected response:
# {"message": "Product service is running"}
```

**Console Output on Successful Start:**

```
Connected to RabbitMQ
Product service is running on port 3001
```

## API Endpoints

### Create Product

```
POST /api/products
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Roles:** `admin`, `seller`

**Form Data Fields:**

- `title` (required): Product title
- `description` (optional): Product description
- `priceAmount` (required): Price amount as number
- `priceCurrency` (optional): Currency code (default: "PKR")
- `stock` (optional): Stock quantity (default: 0)
- `images[]` (optional): Up to 5 image files

**Example (using FormData):**

```javascript
const formData = new FormData();
formData.append("title", "Gaming Laptop");
formData.append("description", "High performance gaming laptop");
formData.append("priceAmount", "120000");
formData.append("priceCurrency", "PKR");
formData.append("stock", "10");
formData.append("images", file1); // File object
formData.append("images", file2);
```

**Response:** `201 Created`

```json
{
  "message": "Product created",
  "data": {
    "_id": "product_id",
    "title": "Gaming Laptop",
    "description": "High performance gaming laptop",
    "price": {
      "amount": 120000,
      "currency": "PKR"
    },
    "seller": "seller_id",
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
}
```

---

### Get All Products

```
GET /api/products
```

**Query Parameters:**

- `q` (optional): Text search query (searches title and description)
- `minprice` (optional): Minimum price filter
- `maxprice` (optional): Maximum price filter
- `skip` (optional): Number of items to skip (default: 0)
- `limit` (optional): Number of items to return (max: 20, default: 20)

**Example:**

```
GET /api/products?q=laptop&minprice=50000&maxprice=150000&skip=0&limit=10
```

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
      "seller": "seller_id",
      "images": [...],
      "stock": 10
    }
  ]
}
```

---

### Get Product By ID

```
GET /api/products/:id
```

**URL Parameters:**

- `id`: The MongoDB ObjectId of the product

**Response:** `200 OK`

```json
{
  "data": {
    "_id": "product_id",
    "title": "Gaming Laptop",
    "description": "High performance gaming laptop",
    "price": {
      "amount": 120000,
      "currency": "PKR"
    },
    "seller": "seller_id",
    "images": [...],
    "stock": 10
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid product ID format
- `404 Not Found` - Product not found

---

### Get Seller's Products

```
GET /api/products/seller
```

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
      "seller": "current_seller_id",
      ...
    }
  ]
}
```

---

### Update Product

```
PATCH /api/products/:id
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Roles:** `seller`

**URL Parameters:**

- `id`: The MongoDB ObjectId of the product

**Request Body:**

```json
{
  "title": "Updated Gaming Laptop",
  "description": "Updated description",
  "price": {
    "amount": 125000,
    "currency": "PKR"
  }
}
```

**Allowed Fields:**

- `title`
- `description`
- `price` (can update amount and/or currency)

**Response:** `200 OK`

```json
{
  "message": "Product updated",
  "data": {
    "_id": "product_id",
    "title": "Updated Gaming Laptop",
    ...
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid product ID
- `404 Not Found` - Product not found
- `403 Forbidden` - Can only update your own products

**Authorization:**

- Sellers can only update their own products

---

### Delete Product

```
DELETE /api/products/:id
```

**Headers:**

```
Cookie: token=<jwt_token>
// OR
Authorization: Bearer <jwt_token>
```

**Roles:** `seller`

**URL Parameters:**

- `id`: The MongoDB ObjectId of the product

**Response:** `200 OK`

```json
{
  "message": "Product deleted"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid product ID
- `404 Not Found` - Product not found
- `403 Forbidden` - Can only delete your own products

**Authorization:**

- Sellers can only delete their own products

---

### Health Check

```
GET /
```

**Response:** `200 OK`

```json
{
  "message": "Product service is running"
}
```

## Database Schema

### Product Model

```javascript
{
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: ["USD", "PKR"],
      default: "PKR"
    }
  },
  seller: {
    type: ObjectId,
    required: true,
    // Reference to user ID from Auth Service
  },
  images: [
    {
      url: String,        // Full image URL from ImageKit
      thumbnail: String,  // Thumbnail URL
      id: String          // ImageKit file ID
    }
  ],
  stock: {
    type: Number,
    default: 0
  }
}
```

**Indexes:**

- Text index on `title` and `description` for search
- Index on `seller` for seller-specific queries

## Message Broker Events

### Published Events

The Product Service publishes the following events to RabbitMQ:

#### 1. Product Created Event (Seller Dashboard)

**Queue:** `PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED`

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

**Purpose:** Syncs product data with Seller Dashboard for analytics

---

#### 2. Product Created Notification

**Queue:** `PRODUCT_NOTIFICATION.PRODUCT_CREATED`

**Payload:**

```json
{
  "email": "seller@example.com",
  "productId": "product_id",
  "sellerId": "seller_id"
}
```

**Purpose:** Triggers email notification for new product launch

## ImageKit Integration

### Upload Process

1. **Receive Images:** Accept multipart/form-data with image files
2. **Process with Multer:** Store in memory buffer
3. **Upload to ImageKit:** Send buffer to ImageKit API
4. **Generate UUID:** Create unique filename
5. **Store URLs:** Save ImageKit URLs in database

### Image Transformations

ImageKit provides automatic transformations via URL parameters:

**Resize Image:**

```
https://ik.imagekit.io/your_id/products/uuid.jpg?tr=w-500,h-500
```

**Get Thumbnail:**

```
https://ik.imagekit.io/your_id/products/tr:w-200,h-200/uuid.jpg
```

**Format Conversion:**

```
https://ik.imagekit.io/your_id/products/uuid.jpg?tr=f-webp
```

### ImageKit Features Used

- **Automatic Format Conversion:** WebP for modern browsers
- **Lazy Loading:** Progressive image loading
- **Responsive Images:** Different sizes for different devices
- **CDN Delivery:** Fast global content delivery
- **Image Optimization:** Automatic compression

## Testing

This project uses **local MongoDB** for testing and **Jest** for test framework.

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

# Run in development/watch mode
npm run dev
```

### Test Coverage

The test suite includes:

- **product.create.test.js** - Product creation with images
- **product.get.test.js** - Get all products with filters
- **product.getById.test.js** - Get specific product
- **product.patch.test.js** - Update product details
- **product.delete.test.js** - Delete product
- **product.seller.get.test.js** - Get seller's products

## Middleware

### Authentication Middleware

Role-based authentication middleware that validates JWT tokens.

**Features:**

- Accepts token from cookies or Authorization header
- Verifies token with JWT_SECRET
- Checks user role (admin, seller)
- Attaches decoded user data to `req.user`

**Usage:**

```javascript
router.post("/", createAuthMiddleware(["admin", "seller"]), controller);
router.patch("/:id", createAuthMiddleware(["seller"]), controller);
```

**Response Codes:**

- `401 Unauthorized` - No token provided
- `401 Unauthorized` - Invalid token
- `403 Forbidden` - Insufficient permissions

### Validation Middleware

Input validation using express-validator.

**Validates:**

- Product title (required, string)
- Description (optional, string)
- Price amount (required, number)
- Currency (optional, valid enum value)
- Stock (optional, number)

## Docker Deployment

### Build Docker Image

```bash
# From project root
docker build -t supernova-product:latest ./product

# Or from product directory
cd product
docker build -t supernova-product:latest .
```

### Run Docker Container

```bash
docker run -d \
  -p 3001:3001 \
  -e MONGO_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  -e IMAGEKIT_PUBLIC_KEY=your_public_key \
  -e IMAGEKIT_PRIVATE_KEY=your_private_key \
  -e IMAGEKIT_URL_ENDPOINT=your_url_endpoint \
  -e RABBIT_URL=your_rabbitmq_url \
  --name product-service \
  supernova-product:latest
```

### Docker Compose

```yaml
product:
  build: ./product
  ports:
    - "3001:3001"
  environment:
    - MONGO_URI=${MONGO_URI}
    - JWT_SECRET=${JWT_SECRET}
    - IMAGEKIT_PUBLIC_KEY=${IMAGEKIT_PUBLIC_KEY}
    - IMAGEKIT_PRIVATE_KEY=${IMAGEKIT_PRIVATE_KEY}
    - IMAGEKIT_URL_ENDPOINT=${IMAGEKIT_URL_ENDPOINT}
    - RABBIT_URL=${RABBIT_URL}
  depends_on:
    - auth
    - rabbitmq
```

## Service Dependencies

The Product Service integrates with:

- **Auth Service** (port 3000): For JWT token generation and validation
- **Seller Dashboard** (port 3007): Receives product events via RabbitMQ
- **Notification Service**: Receives product notification events via RabbitMQ
- **Cart Service** (port 3002): Products referenced in carts
- **Order Service** (port 3003): Products referenced in orders
- **RabbitMQ**: Message broker for event publishing
- **ImageKit**: CDN for image storage and delivery

## Frontend Integration Example

### React Product Upload

```javascript
import React, { useState } from "react";

function CreateProduct() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priceAmount: "",
    priceCurrency: "PKR",
    stock: "",
  });
  const [images, setImages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("priceAmount", formData.priceAmount);
    data.append("priceCurrency", formData.priceCurrency);
    data.append("stock", formData.stock);

    images.forEach((image) => {
      data.append("images", image);
    });

    const response = await fetch("http://localhost:3001/api/products", {
      method: "POST",
      credentials: "include",
      body: data,
    });

    const result = await response.json();
    console.log("Product created:", result);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
      />
      <input
        type="number"
        placeholder="Price"
        value={formData.priceAmount}
        onChange={(e) =>
          setFormData({ ...formData, priceAmount: e.target.value })
        }
      />
      <select
        value={formData.priceCurrency}
        onChange={(e) =>
          setFormData({ ...formData, priceCurrency: e.target.value })
        }
      >
        <option value="PKR">PKR</option>
        <option value="USD">USD</option>
      </select>
      <input
        type="number"
        placeholder="Stock"
        value={formData.stock}
        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
      />
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setImages(Array.from(e.target.files))}
      />
      <button type="submit">Create Product</button>
    </form>
  );
}
```

## Error Handling

**Common Error Responses:**

```json
// Invalid Product ID
{
  "message": "Invalid product id"
}

// Product Not Found
{
  "message": "Product not found"
}

// Forbidden (Not Owner)
{
  "message": "Forbidden: You can only update your own products"
}

// Unauthorized
{
  "message": "Unauthorized: No token provided"
}

// Validation Error
{
  "errors": [
    {
      "msg": "Title is required",
      "param": "title"
    }
  ]
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

**ImageKit Upload Error:**

```
Error: Invalid credentials
```

**Solutions:**

- Verify IMAGEKIT_PUBLIC_KEY is correct
- Verify IMAGEKIT_PRIVATE_KEY is correct
- Check ImageKit account is active
- Ensure URL_ENDPOINT matches your ImageKit ID

**JWT Verification Failed:**

```
Unauthorized: Invalid token
```

**Solutions:**

- Ensure JWT_SECRET matches Auth Service
- Check token is being sent correctly
- Verify token hasn't expired

**Image Upload Failed:**

```
Error uploading images
```

**Solutions:**

- Check file size (ImageKit limits apply)
- Verify image format is supported
- Ensure ImageKit storage quota not exceeded
- Check network connectivity to ImageKit

**Search Not Working:**

```
Products not found with search query
```

**Solutions:**

- Verify text index exists on product collection
- Check search query format
- Rebuild text index if needed: `db.products.createIndex({title: "text", description: "text"})`

**RabbitMQ Connection Error:**

```
Error connecting to RabbitMQ
```

**Solutions:**

- Verify RABBIT_URL is correct
- Check CloudAMQP instance is active
- Ensure credentials are correct

## Performance Considerations

- **Image Optimization:** ImageKit automatically optimizes images
- **CDN Delivery:** Fast global image delivery via ImageKit CDN
- **Text Search:** MongoDB text index for fast search
- **Pagination:** Limit query results to prevent overload
- **Connection Pooling:** Reuses database connections
- **Async Operations:** Non-blocking image uploads and event publishing

## Security Features

- **JWT Authentication:** Secure token-based auth
- **Role-Based Access:** Admin and seller roles
- **Owner Verification:** Sellers can only modify their own products
- **Input Validation:** Validates all input data
- **Secure Image Upload:** Images processed through ImageKit
- **HTTP-only Cookies:** Secure token storage
- **Bearer Token Support:** Authorization header support

## Best Practices

- Always authenticate before product operations
- Validate image files before upload
- Use proper image formats (JPEG, PNG, WebP)
- Keep image sizes reasonable (< 5MB per image)
- Use pagination for product listings
- Implement search filters for better UX
- Monitor ImageKit usage and quota
- Cache frequently accessed products
- Log all product operations for auditing

## Future Enhancements

- Product categories and tags
- Product reviews and ratings
- Inventory alerts for low stock
- Bulk product upload
- Product variants (size, color, etc.)
- Advanced search filters
- Product comparison feature
- Related products recommendations
- Price history tracking
- Seller analytics dashboard

## License

ISC
