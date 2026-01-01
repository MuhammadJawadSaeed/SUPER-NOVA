# Auth Service

Centralized authentication and user management service for the SUPER-NOVA e-commerce platform. Handles user registration, login, logout, JWT-based authentication, and user address management with Redis session caching and RabbitMQ event publishing.

## Overview

The Auth Service is a critical microservice that provides:

- User registration and authentication
- JWT token generation and validation
- Session management with Redis
- User address management
- Event-driven notifications via RabbitMQ message broker
- Role-based access control (user/seller)
- Cookie-based token handling

## Architecture

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas for production, local for testing)
- **Cache**: Redis Cloud (session management)
- **Message Broker**: RabbitMQ (CloudAMQP)
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest with Supertest
- **Validation**: Express-validator
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (for production) OR local MongoDB
- Local MongoDB (for testing - must be installed and running)
- Redis Cloud account (for session management)
- RabbitMQ instance (CloudAMQP or local)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root of the auth directory with the following variables:

```env
# Production/Development Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/auth?retryWrites=true&w=majority

# Test Database (Local MongoDB)
TEST_MONGO_URI=mongodb://localhost:27017/auth_test_db

# JWT Secret
JWT_SECRET=your_secret_key_here

# Redis Cloud Configuration
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password

# RabbitMQ Configuration
RABBIT_URL=amqps://username:password@your-rabbitmq-host/vhost
```

### Environment Variable Details

| Variable | Description | Required | Example |
| -------- | ----------- | -------- | ------- |

### Development Mode

```bash
# Start with auto-reload using nodemon
npm run dev
```

The server will start on port 3000 with hot-reloading enabled.

### Production Mode

```bash
# Start without auto-reload
npm start
```

### Verify Service is Running

````bash
# Test health endpoint
curl http://localhost:3000/

# Expected response:
# {"message": "Auth service is running"}PASSWORD` | Redis authentication password | Yes | `your_redis_password` |
| `RABBIT_URL` | RabbitMQ connection URL (AMQP) | Yes | `amqps://user:pass@host/vhost` |

### Getting Service Credentials

**MongoDB Atlas:**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and database
3. Get connection string from "Connect" button

**Redis Cloud:**
1. Create account at [Redis Cloud](https://redis.com/try-free/)
2. Create a database
3. Get host, port, and password from database details

**RabbitMQ (CloudAMQP):**
1. Create account at [CloudAMQP](https://www.cloudamqp.com/)
2. Create an instance
3. Get AMQP URL from instance details

**Note:** The application uses MongoDB Atlas for production/development data and local MongoDB for testing. This keeps your production data safe and allows faster local testing.

## Running the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
````

## Testing

This project uses **local MongoDB** for testing to save system resources. Make sure MongoDB is running on your machine before running tests.

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

# Run tests in watch mode
npm run test:watch
```

The tests will:

1. Connect to a separate test database (`auth_test_db` by default)
2. Clean up data between tests
3. Drop the entire test database after all tests complete

This ensures your production data remains safe during testing.

## Testing Configuration Options

### Option 1: Local MongoDB (Current Setup)

**Advantages:**

- Faster test execution
- Lower memory usage
- Uses real MongoDB features
- Better for machines with limited resources

**Requirements:**

- MongoDB must be installed and running locally
- Separate test database (automatically created)

**Configuration:** Already configured in `test/setup.js`

### Option 2: MongoMemoryServer (Alternative)

If you prefer in-memory testing without local MongoDB:

**Advantages:**

- No MongoDB installation required
- Isolated test environment

### Authentication

#### Register User

```
POST /api/auth/register
```

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "fullName": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "role": "user" // optional: "user" or "seller", defaults to "user"
}
```

**Response:** `201 Created`

```json
{
  "message": "User created successfully",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": { "firstName": "John", "lastName": "Doe" },
    "role": "user"
  }
}
```

**Sets Cookie:** `token` (JWT)

---

#### Login User

```
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`

```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Sets Cookie:** `token` (JWT)

---

#### Get Current User

```
GET /api/auth/me
```

**Headers:**

```
Cookie: token=<jwt_token>
```

**Response:** `200 OK`

```json
{
  "id": "...",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user"
}
```

---

#### Logout User

```
GET /api/auth/logout
```

**Response:** `200 OK`

```json
{
  "message": "Logout successful"
}
```

**Clears Cookie:** `token`

---

### Address Management

#### Get User Addresses

```
GET /api/auth/users/me/addresses
```

**Headers:**

```
Cookie: token=<jwt_token>
```

**Response:** `200 OK`

```json
{
  "addresses": [
    {
      "_id": "...",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  ]
}
```

---

#### Add User Address

```
POST /api/auth/users/me/addresses
```

**Headers:**

```
Cookie: token=<jwt_token>
```

**Request Body:**

```json
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA"
}
```

**Response:** `201 Created`

```json
{
  "message": "Address added successfully",
  "address": {
    "_id": "...",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

---

#### Delete User Address

```
DELETE /api/auth/users/me/addresses/:addressId
```

**Headers:**

```
Cookie: token=<jwt_token>
```

**Response:** `200 OK`

```json
{
  "message": "Address deleted successfully"
}
```

---

### Health Check

#### Service Health

```
GET /
```

**Response:** `200 OK`

```json
{
  "message": "Auth service is running"
}
```

## Features

### User Management

- User registration with validation
- Secure password hashing with bcrypt
- Role-based user types (user/seller)
- Full name management
- Email and username uniqueness validation

### Authentication & Authorization

- JWT token generation and verification
- Cookie-based token storage
- Protected route middleware
- Token expiration (24 hours)
- Secure logout with cookie clearing

### Session Management

- Redis-based session caching
- Fast session lookups
- Session invalidation on logout

### Address Management

- Multiple addresses per user
- CRUD operations for addresses
- Address validation
- Protected address endpoints

### Event-Driven Architecture

- RabbitMQ message publishing on user registration
- Notifications to Notification Service
- User data sync with Seller Dashboard Service
- Event queues: `AUTH_NOTIFICATION.USER_CREATED`, `AUTH_SELLER_DASHBOARD.USER_CREATED`

### Input Validation

- Express-validator middleware
- Email format validation
- Password strength requirements
- Required field validation
- Custom validation rules

## Docker Deployment

### Build Docker Image

```bash
# From project root
docker build -t supernova-auth:latest ./auth

# Or from auth directory
cd auth
docker build -t supernova-auth:latest .
```

### Run Docker Container

```bash
docker run -d \
  -p 3000:3000 \
  -e MONGO_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  -e REDIS_HOST=your_redis_host \
  -e REDIS_PORT=your_redis_port \
  -e REDIS_PASSWORD=your_redis_password \
  -e RABBIT_URL=your_rabbitmq_url \
  --name auth-service \
  supernova-auth:latest
```

### Docker Compose

```yaml
auth:
  build: ./auth
  ports:
    - "3000:3000"
  environment:
    - MONGO_URI=${MONGO_URI}
    - JWT_SECRET=${JWT_SECRET}
    - REDIS_HOST=${REDIS_HOST}
    - REDIS_PORT=${REDIS_PORT}
    - REDIS_PASSWORD=${REDIS_PASSWORD}
    - RABBIT_URL=${RABBIT_URL}
```

## Message Broker Events

### Published Events

The Auth Service publishes the following events to RabbitMQ:

#### User Created Event

**Queue:** `AUTH_NOTIFICATION.USER_CREATED`

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

**Purpose:** Triggers welcome email notification

---

**Queue:** `AUTH_SELLER_DASHBOARD.USER_CREATED`

**Payload:**

```json
{
  "_id": "user_id",
  "username": "johndoe",
  "email": "john@example.com",
  "fullName": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "role": "seller"
}
```

**Purpose:** Syncs seller data with Seller Dashboard Service

## Database Schema

### User Model

```javascript
{
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    }
  },
  role: {
    type: String,
    enum: ['user', 'seller'],
    default: 'user'
  },
  addresses: [{
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

## Middleware

### Authentication Middleware

Protects routes by verifying JWT tokens from cookies.

**Usage:**

```javascript
router.get("/protected", authMiddleware, controller);
```

**Behavior:**

- Extracts token from cookies
- Verifies token with JWT_SECRET
- Attaches decoded user data to `req.user`
- Returns 401 if token is missing or invalid

### Validation Middleware

Validates request data using express-validator.

**Available Validations:**

- `registerUserValidations` - Username, email, password, fullName
- `loginUserValidations` - Email and password
- `addUserAddressValidations` - Address fields

## Service Dependencies

The Auth Service integrates with:

- **MongoDB**: User data persistence
- **Redis**: Session caching
- **RabbitMQ**: Event publishing
- **Notification Service**: Welcome emails (via message broker)
- **Seller Dashboard**: User data sync (via message broker)

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token with 24-hour expiration
- HTTP-only cookies for token storage
- Input validation and sanitization
- Unique constraints on username and email
- Role-based access control
- Secure database connections (TLS)

## Troubleshooting

### Common Issues

**MongoDB Connection Error:**

```
Error: connect ECONNREFUSED
```

- Verify MONGO_URI is correct
- Check network access in MongoDB Atlas
- Ensure IP whitelist includes your IP

**Redis Connection Error:**

```
Error: Redis connection failed
```

- Verify Redis credentials (host, port, password)
- Check Redis instance is running
- Verify firewall rules

**RabbitMQ Connection Error:**

```
Error: AMQP connection failed
```

- Verify RABBIT_URL format
- Check CloudAMQP instance is active
- Verify credentials are correct

**JWT Verification Failed:**

```
Error: Unauthorized
```

- Ensure JWT_SECRET matches across services
- Check token is being sent in cookies
- Verify token hasn't expired

**Test Failures:**

```
Error: Cannot connect to MongoDB
```

- Start local MongoDB: `mongod` or `net start MongoDB`
- Verify TEST_MONGO_URI points to local instance

## Performance Considerations

- Redis caching reduces database queries
- Connection pooling for MongoDB
- Async/await for non-blocking operations
- Event-driven architecture for loose coupling
- Index on username and email fields

## License

ISC

- Higher memory consumption
- Slower startup time
- Requires more system resources

**To switch to MongoMemoryServer:**

1. Install the package:

```bash
npm install --save-dev mongodb-memory-server
```

2. Update `test/setup.js`:

```javascript
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = "test_jwt_secret";
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});
```

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info
