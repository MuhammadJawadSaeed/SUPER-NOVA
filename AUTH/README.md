# Auth Service

Authentication service with user registration, login, logout, and JWT-based authentication.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (for production) OR local MongoDB
- Local MongoDB (for testing - must be installed and running)
- Redis Cloud account (optional, for session management)

## Installation

```bash
npm install
```

## Environment Variables

The `.env` file is already configured in the project with the following structure:

```env
# Production/Development Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database?appName=your_app

# Test Database (Local MongoDB)
TEST_MONGO_URI=mongodb://localhost:27017/auth_test_db

# JWT Secret
JWT_SECRET=your_secret_key_here

# Server Port
PORT=3000

# Redis Cloud Configuration
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
```

**Note:** The application uses MongoDB Atlas for production/development data and local MongoDB for testing. This keeps your production data safe and allows faster local testing.

## Running the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

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
- Automatic cleanup

**Disadvantages:**

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
