require("dotenv").config();
const mongoose = require("mongoose");
const Claim = require("./models/claim.model");
const User = require("./models/user.model");
const Item = require("./models/item.model");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";

const STATUS_PLAN = [
  ...Array(12).fill("PENDING"),
  ...Array(8).fill("APPROVED"),
  ...Array(6).fill("REJECTED"),
];

const CLAIM_TEXTS = [
  "Tôi có thể mô tả chính xác màu sắc và vị trí bị mất của món đồ này.",
  "Tôi có bằng chứng nhận diện rõ chi tiết vật phẩm và thời điểm đánh rơi.",
  "Tôi có thể cung cấp thông tin xác thực để chứng minh đây là đồ của tôi.",
  "Vật này có dấu hiệu cá nhân riêng, tôi sẵn sàng xác nhận trực tiếp.",
  "Tôi nhớ rất rõ đặc điểm nhận diện, xin được hỗ trợ kiểm tra giúp tôi.",
  "Món đồ này trùng khớp với thông tin tôi đã báo mất trước đó.",
];

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickClaimDate = (idx) => {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, 20));
  date.setHours(8 + (idx % 10), randomInt(0, 59), randomInt(0, 59), 0);
  return date;
};

async function seedMoreClaims() {
  await mongoose.connect(mongoUri);

  const users = await User.find({ role: "user" }, { _id: 1 }).lean();
  const foundItems = await Item.find(
    { status: "FOUND" },
    { _id: 1, user_id: 1 },
  ).lean();

  if (!users.length || !foundItems.length) {
    throw new Error("Khong du user hoac item FOUND de tao claim demo.");
  }

  const existingClaims = await Claim.find(
    {},
    { item_id: 1, user_id: 1 },
  ).lean();
  const usedPair = new Set(
    existingClaims.map(
      (c) => `${c.item_id.toString()}::${c.user_id.toString()}`,
    ),
  );

  const docs = [];
  let pointer = 0;

  while (
    docs.length < STATUS_PLAN.length &&
    pointer < foundItems.length * users.length * 2
  ) {
    const item = foundItems[pointer % foundItems.length];
    const candidateUser = users[(pointer * 7 + 3) % users.length];
    pointer += 1;

    if (!item || !candidateUser) continue;
    if (item.user_id.toString() === candidateUser._id.toString()) continue;

    const key = `${item._id.toString()}::${candidateUser._id.toString()}`;
    if (usedPair.has(key)) continue;
    usedPair.add(key);

    const index = docs.length;
    docs.push({
      item_id: item._id,
      user_id: candidateUser._id,
      description: CLAIM_TEXTS[index % CLAIM_TEXTS.length],
      status: STATUS_PLAN[index],
      created_at: pickClaimDate(index),
    });
  }

  if (!docs.length) {
    throw new Error(
      "Khong tao duoc claim moi (co the da trung qua nhieu du lieu).",
    );
  }

  const beforeTotal = await Claim.countDocuments({});
  const beforePending = await Claim.countDocuments({ status: "PENDING" });

  await Claim.insertMany(docs);

  const afterTotal = await Claim.countDocuments({});
  const afterPending = await Claim.countDocuments({ status: "PENDING" });
  const afterApproved = await Claim.countDocuments({ status: "APPROVED" });
  const afterRejected = await Claim.countDocuments({ status: "REJECTED" });

  console.log(`Da them ${docs.length} claim demo moi.`);
  console.log(`Claims: ${beforeTotal} -> ${afterTotal}`);
  console.log(`Pending: ${beforePending} -> ${afterPending}`);
  console.log(`Approved hien tai: ${afterApproved}`);
  console.log(`Rejected hien tai: ${afterRejected}`);

  await mongoose.disconnect();
}

seedMoreClaims().catch(async (error) => {
  console.error("Seed claims demo that bai:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
