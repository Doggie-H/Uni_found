require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user.model");
const Item = require("./models/item.model");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";

const TOTAL_USERS = 100;
const TOTAL_ITEMS = 80;
const DEFAULT_PASSWORD = "123456";

const getKhoaHocRange = () => {
  const currentYear = new Date().getFullYear();
  return { minYear: currentYear - 8, maxYear: currentYear };
};

const toKhoaHoc = (year) => `K${String(year % 100).padStart(2, "0")}`;

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const DEPARTMENTS = [
  {
    khoa: "Khoa Giao duc",
    nganh: [
      "Cong nghe giao duc",
      "Ho tro giao duc nguoi khuyet tat",
      "Giao duc Tieu hoc",
      "Giao duc Mam non",
      "Giao duc The chat",
      "Su pham Am nhac",
      "Su pham My thuat",
    ],
  },
  {
    khoa: "Khoa Khoa hoc Tu nhien & STEM",
    nganh: [
      "Su pham Toan hoc",
      "Su pham Tin hoc",
      "Su pham Vat ly",
      "Su pham Hoa hoc",
      "Su pham Sinh hoc",
      "Su pham Khoa hoc Tu nhien",
      "Su pham Tin hoc va Cong nghe Tieu hoc",
    ],
  },
  {
    khoa: "Khoa Khoa hoc Xa hoi & Nhan van",
    nganh: [
      "Su pham Ngu van",
      "Su pham Lich su",
      "Su pham Dia ly",
      "Su pham Lich su - Dia ly",
      "Giao duc Cong dan",
      "Giao duc Chinh tri",
      "Giao duc Phap luat",
    ],
  },
  {
    khoa: "Khoa Cong nghe & Khoa hoc Co ban",
    nganh: [
      "Cong nghe thong tin",
      "Khoa hoc du lieu",
      "Vat ly Ky thuat",
      "Hoa phan tich va ung dung",
      "Hoa duoc",
      "Cong nghe Sinh hoc",
      "Nong nghiep thong minh",
    ],
  },
  {
    khoa: "Khoa Xa hoi & Quan ly",
    nganh: [
      "Tam ly hoc",
      "Cong tac Xa hoi",
      "Quan ly Tai nguyen - Moi truong",
      "Quan he quoc te",
      "Quan he cong chung",
      "Bao chi",
      "Van hoc",
      "Van hoa hoc",
      "Van hoa - Du lich",
      "Dia ly Du lich",
    ],
  },
];

const LOCATIONS = [
  "Thu vien Trung tam - Tang 1",
  "Giang duong A - Phong A201",
  "Giang duong B - Phong B303",
  "Can tin khu B",
  "Bai gui xe sinh vien",
  "Hanh lang nha C",
  "San bong da mini",
  "Khu tu hoc",
  "Sanh nha A",
  "Phong may tinh",
];

const ITEM_CATEGORIES = [
  "Ví/Giấy tờ",
  "Đồ Điện Tử",
  "Chìa Khoá",
  "Căn cước/Thẻ",
  "Khác",
];

const ITEM_TITLES = {
  "Ví/Giấy tờ": [
    "Vi da mau den",
    "Vi canvas xanh navy",
    "Tui giay to mini",
    "Vi gap 3 nau",
  ],
  "Đồ Điện Tử": [
    "Dien thoai iPhone",
    "Dien thoai Samsung",
    "Tai nghe bluetooth",
    "Sac du phong",
  ],
  "Chìa Khoá": [
    "Chum chia khoa xe may",
    "Chia khoa phong tro",
    "Chia khoa tu locker",
    "Moc khoa hinh gau",
  ],
  "Căn cước/Thẻ": [
    "The sinh vien UED",
    "Can cuoc cong dan",
    "The ATM",
    "The thu vien",
  ],
  Khác: ["Ba lo den", "Binh nuoc giu nhiet", "Ao khoac xam", "So tay hoc tap"],
};

const IMAGE_URLS = [
  "https://images.unsplash.com/photo-1627123424574-724758594913?w=900&q=80",
  "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
  "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=900&q=80",
  "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=900&q=80",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80",
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900&q=80",
  "https://images.unsplash.com/photo-1585386959984-a41552231658?w=900&q=80",
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900&q=80",
];

const flattenMajors = () => {
  const rows = [];
  DEPARTMENTS.forEach((dep, depIndex) => {
    dep.nganh.forEach((nganh, majorIndex) => {
      rows.push({
        khoa: dep.khoa,
        nganh,
        depIndex: depIndex + 1,
        majorIndex: majorIndex + 1,
      });
    });
  });
  return rows;
};

const pad2 = (n) => String(n).padStart(2, "0");
const pad6 = (n) => String(n).padStart(6, "0");

const buildUserBlueprints = (count) => {
  const majors = flattenMajors();
  const { minYear, maxYear } = getKhoaHocRange();
  const cohortYears = [];
  for (let y = minYear; y <= maxYear; y += 1) cohortYears.push(y);

  const users = [];
  for (let i = 0; i < count; i += 1) {
    const major = majors[i % majors.length];
    const cohortYear =
      cohortYears[(i + Math.floor(i / majors.length)) % cohortYears.length];
    const yy = pad2(cohortYear % 100);
    const depCode = pad2(major.depIndex);
    const majorCode = pad2(major.majorIndex);
    const serial = pad6(i + 1);

    users.push({
      username: `${yy}${depCode}${majorCode}${serial}`,
      password: DEFAULT_PASSWORD,
      full_name: `Seed User ${pad6(i + 1)}`,
      khoa: major.khoa,
      nganh: major.nganh,
      khoa_hoc: toKhoaHoc(cohortYear),
      role: "user",
    });
  }
  return users;
};

const buildItemBlueprints = (count, owners) => {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const category = ITEM_CATEGORIES[i % ITEM_CATEGORIES.length];
    const titleList = ITEM_TITLES[category];
    const titleSeed = titleList[i % titleList.length];
    const title = `[SEED] ${titleSeed} #${pad2((i % 40) + 1)}`;
    const owner = owners[i % owners.length];

    rows.push({
      title,
      category,
      description: `Bai dang seed tu dong #${i + 1}. Vui long lien he nguoi dang bai de xac minh va nhan do vat.`,
      location: LOCATIONS[i % LOCATIONS.length],
      date_lost_found: daysAgo(i % 20),
      image_url: IMAGE_URLS[i % IMAGE_URLS.length],
      status: i % 5 === 0 ? "RETURNED" : "FOUND",
      user_id: owner._id,
    });
  }
  return rows;
};

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Da ket noi MongoDB.");

    // Cleanup seed cũ để luôn có đúng số lượng yêu cầu.
    const existingSeedUsers = await User.find(
      { full_name: /^Seed User / },
      { _id: 1 },
    ).lean();
    const seedUserIds = existingSeedUsers.map((u) => u._id);

    if (seedUserIds.length > 0) {
      await Item.deleteMany({ user_id: { $in: seedUserIds } });
      await User.deleteMany({ _id: { $in: seedUserIds } });
      console.log(`Da xoa ${seedUserIds.length} user seed cu.`);
    }

    await Item.deleteMany({ title: /^\[SEED\]/ });

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const userBlueprints = buildUserBlueprints(TOTAL_USERS);

    const createdUsers = [];
    for (const row of userBlueprints) {
      const created = await User.create({
        username: row.username,
        password: hashedPassword,
        full_name: row.full_name,
        khoa: row.khoa,
        nganh: row.nganh,
        khoa_hoc: row.khoa_hoc,
        role: row.role,
      });
      createdUsers.push(created);
    }

    const itemBlueprints = buildItemBlueprints(TOTAL_ITEMS, createdUsers);
    await Item.insertMany(itemBlueprints);

    console.log(
      `Seed hoan thanh: ${createdUsers.length} users va ${itemBlueprints.length} bai dang da duoc tao.`,
    );
    console.log(`Mat khau mac dinh cho user seed: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    console.error("Seed that bai:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
