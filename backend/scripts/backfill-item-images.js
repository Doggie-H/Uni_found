require("dotenv").config();
const mongoose = require("mongoose");

const Item = require("../models/item-model");
const { buildItemImagePresets } = require("../utils/item-image-presets");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";

const normalizeImages = (item) => {
  return buildItemImagePresets(item);
};

async function main() {
  await mongoose.connect(mongoUri);

  const items = await Item.find({}).sort({ created_at: 1 });
  const bulkOps = [];

  for (const item of items) {
    const nextImages = normalizeImages(item);
    const currentImages = Array.isArray(item.image_urls) ? item.image_urls : [];
    const currentPrimary =
      typeof item.image_url === "string" ? item.image_url.trim() : "";

    const isDifferent =
      currentPrimary !== nextImages[0] ||
      nextImages.length !== currentImages.length ||
      nextImages.some((url, index) => currentImages[index] !== url);

    if (isDifferent) {
      bulkOps.push({
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              image_url: nextImages[0],
              image_urls: nextImages,
            },
          },
        },
      });
    }
  }

  if (bulkOps.length) {
    const result = await Item.bulkWrite(bulkOps);
    console.log(`Updated ${result.modifiedCount || 0} item(s).`);
  } else {
    console.log("No item images needed backfill.");
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore disconnect errors
  }
  process.exit(1);
});
