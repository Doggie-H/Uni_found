require("dotenv").config();
const mongoose = require("mongoose");

const Item = require("../models/item-model");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";

const canonicalizeCategory = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "Khác";

  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (
    normalized.includes("vi") ||
    normalized.includes("giay to") ||
    normalized.includes("giay to tuy than")
  ) {
    return "Ví/Giấy tờ";
  }

  if (
    normalized.includes("dien tu") ||
    normalized.includes("do dien tu") ||
    normalized.includes("thiet bi")
  ) {
    return "Đồ Điện Tử";
  }

  if (normalized.includes("chia khoa")) {
    return "Chìa Khoá";
  }

  if (
    normalized.includes("can cuoc") ||
    normalized.includes("the") ||
    normalized.includes("cccd") ||
    normalized.includes("cmnd")
  ) {
    return "Căn cước/Thẻ";
  }

  if (normalized === "khac" || normalized === "other") {
    return "Khác";
  }

  return raw;
};

const normalizeEnum = (value, allowed, fallback) => {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
  return allowed.includes(raw) ? raw : fallback;
};

const normalizeChecklist = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 12);
};

const normalizeImageUrls = (item) => {
  const urls = [];

  if (typeof item.image_url === "string" && item.image_url.trim()) {
    urls.push(item.image_url.trim());
  }

  if (Array.isArray(item.image_urls)) {
    item.image_urls.forEach((url) => {
      if (typeof url === "string" && url.trim()) {
        urls.push(url.trim());
      }
    });
  }

  return Array.from(new Set(urls)).slice(0, 5);
};

async function main() {
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  const items = await Item.find({}).sort({ created_at: 1 });

  const bulkOps = [];
  let changedCount = 0;

  for (const item of items) {
    const normalizedCategory = canonicalizeCategory(item.category);
    const normalizedPostType = normalizeEnum(
      item.post_type,
      ["FOUND", "LOST"],
      "FOUND",
    );
    const normalizedStatus = normalizeEnum(
      item.status,
      ["FOUND", "RETURNED"],
      "FOUND",
    );
    const normalizedApproval = normalizeEnum(
      item.approval_status,
      ["PENDING", "APPROVED", "REJECTED"],
      "APPROVED",
    );
    const normalizedCustody =
      normalizedPostType === "LOST"
        ? "FINDER"
        : normalizeEnum(item.custody_type, ["FINDER", "ADMIN"], "FINDER");
    const normalizedChecklist = normalizeChecklist(item.category_checklist);
    const normalizedImageUrls = normalizeImageUrls(item);
    const normalizedImageUrl = normalizedImageUrls[0] || null;

    const next = {
      category: normalizedCategory,
      post_type: normalizedPostType,
      status: normalizedStatus,
      approval_status: normalizedApproval,
      custody_type: normalizedCustody,
      category_checklist: normalizedChecklist,
      image_url: normalizedImageUrl,
      image_urls: normalizedImageUrls,
    };

    const changed =
      item.category !== next.category ||
      item.post_type !== next.post_type ||
      item.status !== next.status ||
      item.approval_status !== next.approval_status ||
      item.custody_type !== next.custody_type ||
      JSON.stringify(item.category_checklist || []) !==
        JSON.stringify(next.category_checklist) ||
      item.image_url !== next.image_url ||
      JSON.stringify(item.image_urls || []) !== JSON.stringify(next.image_urls);

    if (!changed) continue;

    changedCount += 1;
    bulkOps.push({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: next },
      },
    });
  }

  if (bulkOps.length > 0) {
    const result = await Item.bulkWrite(bulkOps);
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
    console.log(`Changed docs: ${changedCount}`);
  } else {
    console.log("No legacy item data needed normalization.");
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Failed to normalize legacy item data:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
