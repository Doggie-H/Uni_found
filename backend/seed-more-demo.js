require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user.model");
const Item = require("./models/item.model");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";
const USER_PASSWORD = "123456";

const majorPool = [101, 201, 202, 203, 219, 221, 229, 247, 250, 301];
const khoaPool = [
  "Khoa Giáo dục",
  "Khoa Khoa học Tự nhiên & STEM",
  "Khoa Khoa học Xã hội & Nhân văn",
  "Khoa Công nghệ & Khoa học Cơ bản",
  "Khoa Xã hội & Quản lý",
];
const nganhPool = [
  "Giáo dục Tiểu học",
  "Sư phạm Toán học",
  "Sư phạm Ngữ văn",
  "Công nghệ thông tin",
  "Khoa học dữ liệu",
  "Công tác Xã hội",
  "Sư phạm Tin học",
  "Sư phạm Lịch sử",
  "Quản lý Tài nguyên – Môi trường",
  "Tâm lý học",
];

const itemTemplates = [
  { title: "Ví da nâu", category: "Ví/Giấy tờ", location: "Khu tự học" },
  {
    title: "Điện thoại Samsung",
    category: "Đồ Điện Tử",
    location: "Giảng đường A",
  },
  { title: "Chìa khóa xe", category: "Chìa Khoá", location: "Bãi giữ xe" },
  {
    title: "Thẻ sinh viên",
    category: "Căn cước/Thẻ",
    location: "Hành lang khu B",
  },
  { title: "Bình nước", category: "Khác", location: "Căn tin" },
  { title: "Tai nghe bluetooth", category: "Đồ Điện Tử", location: "Thư viện" },
  { title: "Balo xám", category: "Khác", location: "Sảnh nhà C" },
  { title: "Sổ tay môn học", category: "Khác", location: "Phòng học 302" },
];

const pad = (value, width) => String(value).padStart(width, "0");
const toYearCode = (year) => String(year % 100).padStart(2, "0");

const buildDate = (offsetDays, hour) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function createUsers(count, hashedPassword) {
  const existingUsernames = new Set(
    (await User.find({}, { username: 1 }).lean()).map((u) => u.username),
  );
  const existingEmails = new Set(
    (await User.find({}, { email: 1 }).lean())
      .map((u) => u.email)
      .filter(Boolean),
  );

  const currentYear = new Date().getFullYear();
  const docs = [];

  for (let i = 0; i < count; i += 1) {
    const major = majorPool[i % majorPool.length];
    const enrollYear = currentYear - (i % 5);
    const yearCode = toYearCode(enrollYear);
    const khoaHoc = `K${yearCode}`;

    let serial = 401 + i;
    let mssv = `31${pad(major, 3)}${yearCode}${pad(serial, 3)}`;
    while (existingUsernames.has(mssv)) {
      serial += 1;
      mssv = `31${pad(major, 3)}${yearCode}${pad(serial, 3)}`;
    }
    existingUsernames.add(mssv);

    let email = `demo.user${pad(i + 1, 2)}@ued.udn.vn`;
    let emailIndex = i + 1;
    while (existingEmails.has(email)) {
      emailIndex += 20;
      email = `demo.user${pad(emailIndex, 2)}@ued.udn.vn`;
    }
    existingEmails.add(email);

    docs.push({
      username: mssv,
      email,
      mssv,
      password: hashedPassword,
      full_name: `Sinh vien demo ${pad(i + 1, 2)}`,
      is_ued_student: true,
      khoa: khoaPool[i % khoaPool.length],
      nganh: nganhPool[i % nganhPool.length],
      khoa_hoc: khoaHoc,
      role: "user",
      created_at: buildDate(20 + i, 9 + (i % 6)),
    });
  }

  return User.insertMany(docs);
}

async function createItems(count, owners) {
  const docs = [];

  for (let i = 0; i < count; i += 1) {
    const t = itemTemplates[i % itemTemplates.length];
    const owner = owners[i % owners.length];

    docs.push({
      title: `${t.title} #${pad(i + 1, 2)}`,
      category: t.category,
      description: `Món đồ đang tìm chủ, bổ sung cho demo trình bày #${i + 1}.`,
      location: t.location,
      date_lost_found: buildDate(i % 15, 8 + (i % 10))
        .toISOString()
        .slice(0, 10),
      image_url: `https://picsum.photos/seed/extra-found-${i + 1}/900/600`,
      status: "FOUND",
      returned_at: null,
      user_id: owner._id,
      created_at: buildDate(i % 15, 8 + (i % 10)),
    });
  }

  return Item.insertMany(docs);
}

async function seedMoreDemo() {
  await mongoose.connect(mongoUri);

  const beforeUsers = await User.countDocuments({});
  const beforeItems = await Item.countDocuments({});

  const hashedPassword = await bcrypt.hash(USER_PASSWORD, 10);
  const createdUsers = await createUsers(20, hashedPassword);
  const createdItems = await createItems(30, createdUsers);

  const afterUsers = await User.countDocuments({});
  const afterItems = await Item.countDocuments({});

  console.log(`Da them ${createdUsers.length} user moi.`);
  console.log(`Da them ${createdItems.length} mon do dang tim chu (FOUND).`);
  console.log(`Users: ${beforeUsers} -> ${afterUsers}`);
  console.log(`Items: ${beforeItems} -> ${afterItems}`);
  console.log(`Mat khau user demo moi: ${USER_PASSWORD}`);

  await mongoose.disconnect();
}

seedMoreDemo().catch(async (error) => {
  console.error("Seed them demo that bai:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
