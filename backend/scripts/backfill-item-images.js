require("dotenv").config();
const mongoose = require("mongoose");

const Item = require("../models/item-model");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";

const TARGET_IMAGE_COUNT = 3;

const slugifySeed = (value) => {
  const base = String(value || "item")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "item";
};

const normalizeImages = (item) => {
  const existing = Array.isArray(item.image_urls) ? item.image_urls : [];
  const primaryImage =
    typeof item.image_url === "string" && item.image_url.trim()
      ? item.image_url.trim()
      : existing[0] || "";
  const seed = slugifySeed(item.title || item._id.toString());
  const generated = [];

  if (primaryImage) {
    generated.push(primaryImage);
  } else {
    generated.push(`https://picsum.photos/seed/${seed}-primary/900/600`);
  }

  let index = 2;
  while (generated.length < TARGET_IMAGE_COUNT) {
    generated.push(`https://picsum.photos/seed/${seed}-${index}/900/600`);
    index += 1;
  }

  return Array.from(new Set(generated)).slice(0, TARGET_IMAGE_COUNT);
};

async function main() {
  await mongoose.connect(mongoUri);

  const items = await Item.find({}).sort({ created_at: 1 });
  const bulkOps = [];

  for (const item of items) {
    const nextImages = normalizeImages(item);
    const currentImages = Array.isArray(item.image_urls) ? item.image_urls : [];

    const isDifferent =
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
