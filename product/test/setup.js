const mongoose = require("mongoose");
const Product = require("../src/models/product.model");

let mongoUri;

beforeAll(async () => {
  // Use local MongoDB for tests to avoid external dependencies
  mongoUri = process.env.TEST_MONGO_URI || "mongodb://localhost:27017/product_test_db";
  process.env.MONGO_URI = mongoUri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";

  await mongoose.connect(mongoUri);
  await Product.syncIndexes();
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
