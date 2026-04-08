require("dotenv").config();
const mongoose = require("mongoose");
const Item = require("../models/item-model");

const run = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  const result = await Item.updateMany(
    { approval_status: "PENDING" },
    { $set: { approval_status: "APPROVED" } },
  );

  console.log(`Matched: ${result.matchedCount}`);
  console.log(`Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Failed to approve pending items:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
