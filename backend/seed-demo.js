require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user.model");
const Item = require("./models/item.model");
const Claim = require("./models/claim.model");
const Visit = require("./models/visit.model");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";
const DEMO_ADMIN_PASSWORD = "admin123456";
const DEMO_USER_PASSWORD = "123456";

const currentYear = new Date().getFullYear();
const currentYearCode = String(currentYear % 100).padStart(2, "0");
const toYearCode = (year) => String(year % 100).padStart(2, "0");

const buildMssv = (majorCode, yearCode, serial) =>
  `31${String(majorCode).padStart(3, "0")}${String(yearCode).padStart(2, "0")}${String(serial).padStart(3, "0")}`;

const createDay = (offsetDays, hour = 10, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const createMonth = (offsetMonths, day = 1, hour = 10) => {
  const date = new Date();
  date.setMonth(date.getMonth() - offsetMonths, day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const DEMO_USERS = [
  {
    username: "admin",
    email: "admin@unifound.demo",
    mssv: null,
    password: DEMO_ADMIN_PASSWORD,
    full_name: "Quản trị viên demo",
    is_ued_student: false,
    khoa: null,
    nganh: null,
    khoa_hoc: null,
    role: "admin",
  },
  {
    username: buildMssv(202, currentYearCode, 31),
    email: "nguyen.minh.an@ued.udn.vn",
    mssv: buildMssv(202, currentYearCode, 31),
    password: DEMO_USER_PASSWORD,
    full_name: "Nguyễn Minh An",
    is_ued_student: true,
    khoa: "Khoa Công nghệ & Khoa học Cơ bản",
    nganh: "Công nghệ thông tin",
    khoa_hoc: `K${currentYearCode}`,
    role: "user",
  },
  {
    username: buildMssv(219, toYearCode(currentYear - 1), 14),
    email: "tran.thu.ha@ued.udn.vn",
    mssv: buildMssv(219, toYearCode(currentYear - 1), 14),
    password: DEMO_USER_PASSWORD,
    full_name: "Trần Thu Hà",
    is_ued_student: true,
    khoa: "Khoa Khoa học Xã hội & Nhân văn",
    nganh: "Sư phạm Ngữ văn",
    khoa_hoc: `K${String((currentYear - 1) % 100).padStart(2, "0")}`,
    role: "user",
  },
  {
    username: buildMssv(201, toYearCode(currentYear - 2), 7),
    email: "le.quoc.bao@ued.udn.vn",
    mssv: buildMssv(201, toYearCode(currentYear - 2), 7),
    password: DEMO_USER_PASSWORD,
    full_name: "Lê Quốc Bảo",
    is_ued_student: true,
    khoa: "Khoa Giáo dục",
    nganh: "Giáo dục Tiểu học",
    khoa_hoc: `K${String((currentYear - 2) % 100).padStart(2, "0")}`,
    role: "user",
  },
  {
    username: buildMssv(101, toYearCode(currentYear - 3), 22),
    email: "pham.gia.huy@ued.udn.vn",
    mssv: buildMssv(101, toYearCode(currentYear - 3), 22),
    password: DEMO_USER_PASSWORD,
    full_name: "Phạm Gia Huy",
    is_ued_student: true,
    khoa: "Khoa Xã hội & Quản lý",
    nganh: "Công tác Xã hội",
    khoa_hoc: `K${String((currentYear - 3) % 100).padStart(2, "0")}`,
    role: "user",
  },
  {
    username: buildMssv(203, toYearCode(currentYear - 4), 9),
    email: "vo.thuy.linh@ued.udn.vn",
    mssv: buildMssv(203, toYearCode(currentYear - 4), 9),
    password: DEMO_USER_PASSWORD,
    full_name: "Võ Thùy Linh",
    is_ued_student: true,
    khoa: "Khoa Công nghệ & Khoa học Cơ bản",
    nganh: "Khoa học dữ liệu",
    khoa_hoc: `K${String((currentYear - 4) % 100).padStart(2, "0")}`,
    role: "user",
  },
];

const DEMO_ITEMS = [
  {
    title: "Ví da màu đen",
    category: "Ví/Giấy tờ",
    description:
      "Ví da đen có 2 ngăn, bên trong có thẻ sinh viên và một ít tiền mặt. Nhặt được ở khu thư viện.",
    location: "Thư viện Trung tâm - Tầng 1",
    date_lost_found: createDay(2).toISOString().slice(0, 10),
    image_url: "https://picsum.photos/seed/ued-wallet-black/900/600",
    owner: 1,
    status: "FOUND",
  },
  {
    title: "Thẻ sinh viên UED",
    category: "Căn cước/Thẻ",
    description:
      "Thẻ sinh viên màu xanh, tên rõ ràng, nhặt được tại hành lang khu A.",
    location: "Giảng đường A - Hành lang tầng 2",
    date_lost_found: createDay(1).toISOString().slice(0, 10),
    image_url: "https://picsum.photos/seed/ued-student-card/900/600",
    owner: 2,
    status: "RETURNED",
    returned_at: createDay(1, 17).toISOString(),
  },
  {
    title: "Tai nghe bluetooth Sony",
    category: "Đồ Điện Tử",
    description:
      "Tai nghe không dây màu đen, còn hộp sạc, nhặt được ở khu tự học.",
    location: "Khu tự học",
    date_lost_found: createDay(3).toISOString().slice(0, 10),
    image_url: "https://picsum.photos/seed/ued-headphone-sony/900/600",
    owner: 2,
    status: "RETURNED",
    returned_at: createDay(1, 16).toISOString(),
  },
  {
    title: "Chìa khóa xe máy 3 phím",
    category: "Chìa Khoá",
    description:
      "Một chùm chìa khóa xe máy có móc nhựa đỏ, tìm được ở bãi xe sinh viên.",
    location: "Bãi gửi xe sinh viên",
    date_lost_found: createDay(4).toISOString().slice(0, 10),
    image_url: "https://picsum.photos/seed/ued-motorbike-key/900/600",
    owner: 3,
    status: "FOUND",
  },
  {
    title: "Bình nước giữ nhiệt",
    category: "Khác",
    description:
      "Bình giữ nhiệt màu trắng, nắp vặn, còn khá mới. Nhặt được trong canteen.",
    location: "Căn tin khu B",
    date_lost_found: createDay(5).toISOString().slice(0, 10),
    image_url: "https://picsum.photos/seed/ued-thermos-bottle/900/600",
    owner: 4,
    status: "FOUND",
  },
  {
    title: "Laptop Dell XPS 13",
    category: "Đồ Điện Tử",
    description:
      "Laptop bạc, có dán sticker nhỏ ở góc phải, nhặt được ở phòng máy tính.",
    location: "Phòng máy tính",
    date_lost_found: createDay(7).toISOString().slice(0, 10),
    image_url: "https://picsum.photos/seed/ued-laptop-xps/900/600",
    owner: 4,
    status: "FOUND",
  },
  {
    title: "Balo đen",
    category: "Khác",
    description: "Balo vải màu đen, bên trong có sổ tay và áo khoác mỏng.",
    location: "Sảnh nhà A",
    date_lost_found: createDay(8).toISOString().slice(0, 10),
    image_url: "https://picsum.photos/seed/ued-black-backpack/900/600",
    owner: 1,
    status: "RETURNED",
    returned_at: createDay(6, 11).toISOString(),
  },
  {
    title: "Tai nghe AirPods",
    category: "Đồ Điện Tử",
    description: "Tai nghe trắng, hộp sạc sạch, nhặt được tại sân bóng mini.",
    location: "Sân bóng đá mini",
    date_lost_found: createDay(9).toISOString().slice(0, 10),
    image_url: "https://picsum.photos/seed/ued-airpods-white/900/600",
    owner: 5,
    status: "FOUND",
  },
];

const DEMO_CLAIMS = [
  {
    itemIndex: 0,
    userIndex: 2,
    description:
      "Tôi mô tả được chi tiết ngăn trong ví và vài vật dụng bên trong để xác minh.",
    status: "PENDING",
  },
  {
    itemIndex: 1,
    userIndex: 3,
    description:
      "Mã sinh viên của tôi trùng khớp, tôi có thể xác nhận thông tin trên thẻ.",
    status: "APPROVED",
  },
  {
    itemIndex: 3,
    userIndex: 1,
    description: "Tôi biết chùm chìa khóa có móc nhựa đỏ và số phím cụ thể.",
    status: "PENDING",
  },
  {
    itemIndex: 6,
    userIndex: 2,
    description:
      "Tôi có thể mô tả sticker ở góc laptop và cấu hình máy để chứng minh.",
    status: "REJECTED",
  },
];

const buildVisits = () => {
  const docs = [];
  const paths = ["/", "/create-item", "/item/demo", "/login"];

  for (let dayOffset = 0; dayOffset < 30; dayOffset += 1) {
    const day = createDay(dayOffset, 9 + (dayOffset % 4));
    docs.push({
      path: paths[dayOffset % paths.length],
      referrer: "demo-reset",
      created_at: day,
    });
  }

  for (let monthOffset = 0; monthOffset < 12; monthOffset += 1) {
    const monthVisit = createMonth(monthOffset, 3 + (monthOffset % 5), 14);
    docs.push({
      path: paths[(monthOffset + 1) % paths.length],
      referrer: "demo-reset",
      created_at: monthVisit,
    });
  }

  return docs;
};

async function seedDemo() {
  await mongoose.connect(mongoUri);

  // Xoa sach database hien tai de tao moi du lieu demo tu dau.
  await mongoose.connection.dropDatabase();

  const hashedAdminPassword = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
  const hashedUserPassword = await bcrypt.hash(DEMO_USER_PASSWORD, 10);

  const createdUsers = [];
  for (const user of DEMO_USERS) {
    const created = await User.create({
      username: user.username,
      email: user.email,
      mssv: user.mssv,
      password:
        user.role === "admin" ? hashedAdminPassword : hashedUserPassword,
      full_name: user.full_name,
      is_ued_student: user.is_ued_student,
      khoa: user.khoa,
      nganh: user.nganh,
      khoa_hoc: user.khoa_hoc,
      role: user.role,
    });
    createdUsers.push(created);
  }

  const createdItems = [];
  for (const item of DEMO_ITEMS) {
    const owner = createdUsers[item.owner];
    const created = await Item.create({
      title: item.title,
      category: item.category,
      description: item.description,
      location: item.location,
      date_lost_found: item.date_lost_found,
      image_url: item.image_url,
      status: item.status,
      returned_at: item.returned_at || null,
      user_id: owner._id,
    });
    createdItems.push(created);
  }

  const claimDocs = [];
  for (const claim of DEMO_CLAIMS) {
    const item = createdItems[claim.itemIndex];
    const user = createdUsers[claim.userIndex];
    claimDocs.push({
      item_id: item._id,
      user_id: user._id,
      description: claim.description,
      status: claim.status,
      created_at: createDay(
        2 + claimDocs.length,
        15 + claimDocs.length,
      ).toISOString(),
    });
  }

  await Claim.insertMany(claimDocs);
  await Visit.insertMany(buildVisits());

  console.log(
    `Da reset demo voi ${createdUsers.length} users, ${createdItems.length} items, ${claimDocs.length} claims va ${30 + 12} visits.`,
  );
  console.log(`Admin demo: admin / ${DEMO_ADMIN_PASSWORD}`);
  console.log(
    `User demo: MSV bat dau theo nam hien tai, mat khau ${DEMO_USER_PASSWORD}`,
  );

  await mongoose.disconnect();
}

seedDemo().catch(async (error) => {
  console.error("Demo reset that bai:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
