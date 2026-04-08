require("dotenv").config();
const mongoose = require("mongoose");
const Item = require("../models/item-model");

const run = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  const grouped = await Item.aggregate([
    {
      $group: {
        _id: "$approval_status",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  console.log(JSON.stringify(grouped, null, 2));
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Failed to check item approval status:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
