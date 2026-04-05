require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.model");
const Item = require("./models/item.model");
const Claim = require("./models/claim.model");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";

const isValidKhoaHoc = (value) => {
  if (!value) return true;
  const match = /^K(\d{2})$/.exec(value);
  if (!match) return false;
  const year = 2000 + Number.parseInt(match[1], 10);
  const currentYear = new Date().getFullYear();
  return year >= currentYear - 8 && year <= currentYear;
};

const isValidUser = (user) => {
  if (user.username === "admin") return true;
  if (!/^\d{12}$/.test(String(user.username || ""))) return false;
  if (typeof user.full_name !== "string" || user.full_name.trim().length < 3) {
    return false;
  }
  if (user.role && !["admin", "user"].includes(user.role)) return false;
  return isValidKhoaHoc(user.khoa_hoc);
};

const isValidItem = (item, userById) => {
  if (typeof item.title !== "string" || !item.title.trim()) return false;
  if (typeof item.location !== "string" || !item.location.trim()) return false;
  if (!["FOUND", "RETURNED"].includes(item.status)) return false;
  if (!item.user_id || !userById.has(String(item.user_id))) return false;
  if (typeof item.date_lost_found === "string" && item.date_lost_found) {
    const parsed = new Date(item.date_lost_found);
    if (Number.isNaN(parsed.getTime())) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsed > today) return false;
  }
  return true;
};

async function cleanupInvalidData() {
  await mongoose.connect(mongoUri);

  const users = await User.find({}).lean();
  const items = await Item.find({}).lean();
  const claims = await Claim.find({}).lean();

  const invalidUsers = users.filter((user) => !isValidUser(user));
  const invalidUserIds = invalidUsers.map((user) => String(user._id));
  const userById = new Map(users.map((user) => [String(user._id), user]));

  const invalidItems = items.filter(
    (item) =>
      isValidItem(item, userById) === false ||
      invalidUserIds.includes(String(item.user_id)),
  );
  const invalidItemIds = invalidItems.map((item) => String(item._id));
  const itemById = new Map(items.map((item) => [String(item._id), item]));

  const invalidClaims = claims.filter((claim) => {
    const item = itemById.get(String(claim.item_id));
    const itemOwnerId = item ? String(item.user_id) : null;
    const claimUserId = String(claim.user_id);
    const claimItemId = String(claim.item_id);

    if (!["PENDING", "APPROVED", "REJECTED"].includes(claim.status))
      return true;
    if (!userById.has(claimUserId)) return true;
    if (!itemById.has(claimItemId)) return true;
    if (invalidUserIds.includes(claimUserId)) return true;
    if (invalidItemIds.includes(claimItemId)) return true;
    if (itemOwnerId && itemOwnerId === claimUserId) return true;
    return false;
  });

  const invalidClaimIds = invalidClaims.map((claim) => String(claim._id));

  console.log(
    JSON.stringify(
      {
        totalUsers: users.length,
        totalItems: items.length,
        totalClaims: claims.length,
        invalidUsers: invalidUsers.length,
        invalidItems: invalidItems.length,
        invalidClaims: invalidClaims.length,
      },
      null,
      2,
    ),
  );

  if (
    invalidUsers.length === 0 &&
    invalidItems.length === 0 &&
    invalidClaims.length === 0
  ) {
    console.log("Khong co du lieu khong phu hop can xoa.");
    await mongoose.disconnect();
    return;
  }

  if (invalidClaimIds.length > 0) {
    await Claim.deleteMany({ _id: { $in: invalidClaimIds } });
  }
  if (invalidItemIds.length > 0) {
    await Claim.deleteMany({ item_id: { $in: invalidItemIds } });
    await Item.deleteMany({ _id: { $in: invalidItemIds } });
  }
  if (invalidUserIds.length > 0) {
    await Claim.deleteMany({ user_id: { $in: invalidUserIds } });
    await User.deleteMany({ _id: { $in: invalidUserIds } });
  }

  console.log(
    `Da xoa ${invalidUsers.length} user, ${invalidItems.length} item va ${invalidClaims.length} claim khong phu hop.`,
  );

  await mongoose.disconnect();
}

cleanupInvalidData().catch(async (error) => {
  console.error("Cleanup that bai:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
