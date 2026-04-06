const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user-model");

const createDefaultAdmin = async () => {
  const existingAdmin = await User.findOne({ username: "admin" }).lean();
  if (existingAdmin) {
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await User.create({
    username: "admin",
    password: hashedPassword,
    full_name: "Quan tri vien",
    role: "admin",
  });

  console.log("Da tao tai khoan admin mac dinh (username: admin).");
};

const connectDatabase = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("Da ket noi MongoDB thanh cong.");
  await createDefaultAdmin();
};

module.exports = { connectDatabase };

