const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Server connected to Database");
  } catch (err) {
    console.error("Server is not connected to Database", err);
  }
}

module.exports = connectDB;