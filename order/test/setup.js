const mongoose = require("mongoose");

beforeAll(async () => {
  process.env.TEST_MONGO_URI =
    process.env.TEST_MONGO_URI || "mongodb://localhost:27017/order_test_db";
  process.env.MONGO_URI = process.env.TEST_MONGO_URI;
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
});

afterEach(async () => {
  if (mongoose.connection?.readyState === 1) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection?.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});
