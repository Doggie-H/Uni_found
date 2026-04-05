require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.model");
const Item = require("./models/item.model");
const Claim = require("./models/claim.model");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";
const TOTAL_CLAIMS = 30;

async function seedClaims() {
  await mongoose.connect(mongoUri);

  const seedUsers = await User.find({ full_name: /^Seed User / }).lean();
  if (seedUsers.length === 0) {
    throw new Error("Khong tim thay seed users. Hay chay node seed.js truoc.");
  }

  const seedFoundItems = await Item.find({
    title: /^\[SEED\]/,
    status: "FOUND",
  }).lean();

  if (seedFoundItems.length === 0) {
    throw new Error("Khong tim thay seed items status FOUND.");
  }

  // Xoa claim seed cu de luon co dung 30 claim moi.
  await Claim.deleteMany({ description: /^\[SEED_CLAIM\]/ });

  const claims = [];
  let itemCursor = 0;
  let userCursor = 0;
  let guard = 0;

  while (claims.length < TOTAL_CLAIMS && guard < 20000) {
    guard += 1;
    const item = seedFoundItems[itemCursor % seedFoundItems.length];
    const user = seedUsers[userCursor % seedUsers.length];

    itemCursor += 1;
    userCursor += 3; // buoc nhay de phan bo deu hon

    if (String(item.user_id) === String(user._id)) {
      continue; // khong cho self-claim
    }

    const key = `${item._id}-${user._id}`;
    const existsInBatch = claims.some(
      (c) =>
        String(c.item_id) === String(item._id) &&
        String(c.user_id) === String(user._id),
    );
    if (existsInBatch) continue;

    claims.push({
      item_id: item._id,
      user_id: user._id,
      description: `[SEED_CLAIM] Yeu cau nhan do #${claims.length + 1}: Toi co the mo ta chi tiet dac diem nhan dang cua mon do nay.`,
      status: "PENDING",
      created_at: new Date(Date.now() - (claims.length % 10) * 3600 * 1000),
      _key: key,
    });
  }

  if (claims.length < TOTAL_CLAIMS) {
    throw new Error(
      `Chi tao duoc ${claims.length}/${TOTAL_CLAIMS} claim hop le.`,
    );
  }

  const docs = claims.map(({ _key, ...rest }) => rest);
  await Claim.insertMany(docs, { ordered: true });

  console.log(`Da tao ${docs.length} claim seed.`);
  await mongoose.disconnect();
}

seedClaims().catch(async (err) => {
  console.error("Seed claim that bai:", err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
