require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/user.model");
const Item = require("./models/item.model");
const Claim = require("./models/claim.model");
const Conversation = require("./models/conversation.model");
const Message = require("./models/message.model");
const Visit = require("./models/visit.model");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";

const ADMIN_PASSWORD = "admin123456";
const USER_PASSWORD = "123456";

const createDate = (offsetDays, hour = 9, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const todayYMD = (offsetDays = 0) =>
  createDate(offsetDays).toISOString().slice(0, 10);

const USERS = [
  {
    username: "admin",
    email: "admin@unifound.demo",
    mssv: null,
    full_name: "Quan tri vien demo",
    role: "admin",
    is_ued_student: false,
    khoa: null,
    nganh: null,
    khoa_hoc: null,
  },
  {
    username: "3120202401",
    email: "an.finder@ued.udn.vn",
    mssv: "3120202401",
    full_name: "Nguyen Minh An",
    role: "user",
    is_ued_student: true,
    khoa: "Khoa Cong nghe & Khoa hoc Co ban",
    nganh: "Cong nghe thong tin",
    khoa_hoc: "K24",
  },
  {
    username: "3121902302",
    email: "ha.seeker@ued.udn.vn",
    mssv: "3121902302",
    full_name: "Tran Thu Ha",
    role: "user",
    is_ued_student: true,
    khoa: "Khoa Khoa hoc Xa hoi & Nhan van",
    nganh: "Su pham Ngu van",
    khoa_hoc: "K23",
  },
  {
    username: "3120302203",
    email: "bao.finder@ued.udn.vn",
    mssv: "3120302203",
    full_name: "Le Quoc Bao",
    role: "user",
    is_ued_student: true,
    khoa: "Khoa Giao duc",
    nganh: "Giao duc Tieu hoc",
    khoa_hoc: "K22",
  },
  {
    username: "3120102104",
    email: "linh.seeker@ued.udn.vn",
    mssv: "3120102104",
    full_name: "Vo Thuy Linh",
    role: "user",
    is_ued_student: true,
    khoa: "Khoa Cong nghe & Khoa hoc Co ban",
    nganh: "Khoa hoc du lieu",
    khoa_hoc: "K21",
  },
  {
    username: "3124702005",
    email: "huy.poster@ued.udn.vn",
    mssv: "3124702005",
    full_name: "Pham Gia Huy",
    role: "user",
    is_ued_student: true,
    khoa: "Khoa Xa hoi & Quan ly",
    nganh: "Cong tac Xa hoi",
    khoa_hoc: "K20",
  },
];

async function seedChatDemo() {
  await mongoose.connect(mongoUri);

  await mongoose.connection.dropDatabase();

  const hashedAdminPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const hashedUserPassword = await bcrypt.hash(USER_PASSWORD, 10);

  const createdUsers = [];
  for (const u of USERS) {
    const user = await User.create({
      ...u,
      password: u.role === "admin" ? hashedAdminPassword : hashedUserPassword,
    });
    createdUsers.push(user);
  }

  const admin = createdUsers.find((u) => u.role === "admin");
  const anFinder = createdUsers.find((u) => u.username === "3120202401");
  const haSeeker = createdUsers.find((u) => u.username === "3121902302");
  const baoFinder = createdUsers.find((u) => u.username === "3120302203");
  const linhSeeker = createdUsers.find((u) => u.username === "3120102104");
  const huyPoster = createdUsers.find((u) => u.username === "3124702005");

  const items = await Item.insertMany([
    {
      title: "Tai nghe AirPods Pro",
      post_type: "FOUND",
      category: "Do Dien Tu",
      description:
        "Tai nghe mau trang, hop sac con pin, nhat duoc tai san bong mini.",
      brand: "Apple",
      color: "Trang",
      distinctive_features: "Vo hop co vet xuoc nho goc trai",
      contact_info: anFinder.email,
      location: "San bong da mini",
      date_lost_found: todayYMD(2),
      found_at: createDate(2, 17, 30).toISOString(),
      image_url: "https://picsum.photos/seed/chat-airpods/900/600",
      custody_type: "FINDER",
      status: "FOUND",
      user_id: anFinder._id,
      created_at: createDate(2, 18, 0),
    },
    {
      title: "Vi da den",
      post_type: "FOUND",
      category: "Vi/Giay to",
      description:
        "Vi da den co the sinh vien ben trong, nhat duoc o hanh lang khu A.",
      brand: "Khong ro",
      color: "Den",
      distinctive_features: "Co duong chi mau nau sat mep",
      contact_info: baoFinder.email,
      location: "Giang duong A - tang 2",
      date_lost_found: todayYMD(1),
      found_at: createDate(1, 10, 45).toISOString(),
      image_url: "https://picsum.photos/seed/chat-wallet/900/600",
      custody_type: "ADMIN",
      status: "FOUND",
      user_id: baoFinder._id,
      created_at: createDate(1, 11, 15),
    },
    {
      title: "Laptop Dell XPS 13",
      post_type: "FOUND",
      category: "Do Dien Tu",
      description:
        "Laptop bac co sticker nho, da duoc giao cho phong cong tac sinh vien.",
      brand: "Dell",
      color: "Bac",
      distinctive_features: "Sticker nho goc phai ban phim",
      contact_info: admin.email,
      location: "Phong may tinh",
      date_lost_found: todayYMD(5),
      found_at: createDate(5, 14, 0).toISOString(),
      image_url: "https://picsum.photos/seed/chat-laptop/900/600",
      custody_type: "ADMIN",
      status: "RETURNED",
      returned_at: createDate(1, 16, 30),
      user_id: baoFinder._id,
      created_at: createDate(5, 15, 10),
    },
    {
      title: "Mat the sinh vien UED",
      post_type: "LOST",
      category: "Can cuoc/The",
      description: "Minh bi mat the sinh vien mau xanh, co bao the nhua trong.",
      brand: "UED",
      color: "Xanh",
      distinctive_features: "Bao the trong co day deo xanh",
      contact_info: haSeeker.email,
      location: "Thu vien trung tam",
      date_lost_found: todayYMD(3),
      lost_at: createDate(3, 9, 30).toISOString(),
      image_url: "https://picsum.photos/seed/chat-student-card-lost/900/600",
      custody_type: "FINDER",
      status: "FOUND",
      user_id: haSeeker._id,
      created_at: createDate(3, 10, 0),
    },
    {
      title: "Mat balo den",
      post_type: "LOST",
      category: "Khac",
      description: "Balo vai mau den, ben trong co so tay va ao khoac mong.",
      brand: "Khong ro",
      color: "Den",
      distinctive_features: "Moc khoa hinh sao mau do",
      contact_info: linhSeeker.email,
      location: "Sanh nha A",
      date_lost_found: todayYMD(4),
      lost_at: createDate(4, 8, 10).toISOString(),
      image_url: "https://picsum.photos/seed/chat-backpack-lost/900/600",
      custody_type: "FINDER",
      status: "FOUND",
      user_id: linhSeeker._id,
      created_at: createDate(4, 9, 0),
    },
    {
      title: "The xe va chia khoa",
      post_type: "FOUND",
      category: "Chia Khoa",
      description: "Nhat duoc bo the xe va chia khoa o bai giu xe sinh vien.",
      brand: "Honda",
      color: "Den",
      distinctive_features: "Moc khoa hinh gau bong nho",
      contact_info: huyPoster.email,
      location: "Bai giu xe sinh vien",
      date_lost_found: todayYMD(0),
      found_at: createDate(0, 12, 20).toISOString(),
      image_url: "https://picsum.photos/seed/chat-key/900/600",
      custody_type: "FINDER",
      status: "FOUND",
      user_id: huyPoster._id,
      created_at: createDate(0, 12, 30),
    },
  ]);

  const airpodsFound = items.find((i) => i.title === "Tai nghe AirPods Pro");
  const walletAdmin = items.find((i) => i.title === "Vi da den");
  const laptopReturned = items.find((i) => i.title === "Laptop Dell XPS 13");

  const claims = await Claim.insertMany([
    {
      item_id: airpodsFound._id,
      user_id: haSeeker._id,
      description:
        "Toi co the mo ta vet xuoc o vo hop sac va ma serial tren iPhone da ket noi.",
      status: "CONNECTED",
      created_at: createDate(1, 9, 20),
    },
    {
      item_id: walletAdmin._id,
      user_id: linhSeeker._id,
      description:
        "Toi nho ro trong vi co the sinh vien va giay bien lai mau hong.",
      status: "PENDING",
      created_at: createDate(0, 14, 5),
    },
    {
      item_id: laptopReturned._id,
      user_id: haSeeker._id,
      description:
        "Toi co the xac nhan sticker va thong tin dang nhap trong may.",
      status: "RETURN_CONFIRMED",
      seeker_confirmed: true,
      holder_confirmed: true,
      returned_confirmed_at: createDate(1, 16, 30),
      created_at: createDate(4, 10, 15),
    },
  ]);

  const connectedClaim = claims.find((c) => c.status === "CONNECTED");
  const pendingClaim = claims.find((c) => c.status === "PENDING");
  const returnedClaim = claims.find((c) => c.status === "RETURN_CONFIRMED");

  const conversations = await Conversation.insertMany([
    {
      item_id: airpodsFound._id,
      claim_id: connectedClaim._id,
      type: "FINDER_SEEKER",
      participants: [haSeeker._id, anFinder._id],
      created_at: createDate(1, 9, 30),
    },
    {
      item_id: walletAdmin._id,
      claim_id: pendingClaim._id,
      type: "SEEKER_ADMIN",
      participants: [linhSeeker._id, admin._id],
      created_at: createDate(0, 14, 10),
    },
    {
      item_id: laptopReturned._id,
      claim_id: returnedClaim._id,
      type: "SEEKER_ADMIN",
      participants: [haSeeker._id, admin._id],
      created_at: createDate(4, 10, 20),
    },
  ]);

  const convoFinderSeeker = conversations.find(
    (c) => c.type === "FINDER_SEEKER",
  );
  const convoPendingAdmin = conversations.find(
    (c) => c.claim_id.toString() === pendingClaim._id.toString(),
  );
  const convoReturnedAdmin = conversations.find(
    (c) => c.claim_id.toString() === returnedClaim._id.toString(),
  );

  await Message.insertMany([
    {
      conversation_id: convoFinderSeeker._id,
      sender_id: null,
      is_system: true,
      system_label: "He thong",
      body: "He thong da ket noi nguoi tim va nguoi nhat. Hai ben vui long trao doi de xac minh.",
      created_at: createDate(1, 9, 31),
    },
    {
      conversation_id: convoFinderSeeker._id,
      sender_id: haSeeker._id,
      body: "Chao ban, minh nghi day la AirPods cua minh. Minh mo ta duoc vet xuoc o vo hop.",
      created_at: createDate(1, 9, 33),
    },
    {
      conversation_id: convoFinderSeeker._id,
      sender_id: anFinder._id,
      body: "Ban gui them mo ta vi tri vet xuoc va phu kien ben trong de minh doi chieu nhe.",
      created_at: createDate(1, 9, 40),
    },
    {
      conversation_id: convoPendingAdmin._id,
      sender_id: null,
      is_system: true,
      system_label: "He thong",
      body: "Yeu cau nhan lai da duoc tao va gui den admin.",
      created_at: createDate(0, 14, 11),
    },
    {
      conversation_id: convoPendingAdmin._id,
      sender_id: linhSeeker._id,
      body: "Em da gui thong tin xac minh vi da. Mong admin ho tro duyet.",
      created_at: createDate(0, 14, 13),
    },
    {
      conversation_id: convoReturnedAdmin._id,
      sender_id: null,
      is_system: true,
      system_label: "He thong",
      body: "Admin da duyet yeu cau va ghi nhan xac nhan hoan tra 2 chieu.",
      created_at: createDate(1, 16, 31),
    },
    {
      conversation_id: convoReturnedAdmin._id,
      sender_id: admin._id,
      body: "Ho so da hoan tat. Cam on ban da phoi hop xac nhan.",
      created_at: createDate(1, 16, 34),
    },
  ]);

  await Visit.insertMany([
    { path: "/", referrer: "chat-seed", created_at: createDate(0, 8, 0) },
    {
      path: "/messages",
      referrer: "chat-seed",
      created_at: createDate(0, 8, 5),
    },
    {
      path: "/item/demo",
      referrer: "chat-seed",
      created_at: createDate(0, 8, 12),
    },
  ]);

  // Approved tất cả demo items
  await Item.updateMany({}, { approval_status: "APPROVED" });

  console.log("Da tao moi DB demo de test tinh nang nhan tin.");
  console.log("Tai khoan:");
  console.log(`- Admin: admin / ${ADMIN_PASSWORD}`);
  console.log(`- User chung: mat khau ${USER_PASSWORD}`);
  console.log("Danh sach user:");
  console.log("- 3120202401 (Nguyen Minh An) - finder");
  console.log("- 3121902302 (Tran Thu Ha) - seeker");
  console.log("- 3120302203 (Le Quoc Bao) - finder");
  console.log("- 3120102104 (Vo Thuy Linh) - seeker");
  console.log("- 3124702005 (Pham Gia Huy) - poster");
  console.log(
    `Items: ${items.length}, Claims: ${claims.length}, Conversations: ${conversations.length}`,
  );

  await mongoose.disconnect();
}

seedChatDemo().catch(async (error) => {
  console.error("Seed chat demo that bai:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
