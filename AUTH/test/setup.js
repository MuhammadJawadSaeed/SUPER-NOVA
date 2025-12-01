const mongoose = require("mongoose");

beforeAll(async () => {
  // Use local MongoDB for testing
  // Make sure MongoDB is running on your machine
  const testDbUri =
    process.env.TEST_MONGO_URI || "mongodb://localhost:27017/auth_test_db";
  process.env.MONGO_URI = testDbUri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";

  await mongoose.connect(testDbUri);
});

afterEach(async () => {
  // Cleanup all collections between tests
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  // Drop test database and close connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
