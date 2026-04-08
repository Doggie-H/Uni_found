require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/user-model");
const Item = require("./models/item-model");
const Claim = require("./models/claim-model");
const Conversation = require("./models/conversation-model");
const Message = require("./models/message-model");
const Visit = require("./models/visit-model");

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
    full_name: "Quản trị viên demo",
    role: "admin",
    is_ued_student: false,
    khoa: null,
    nganh: null,
    khoa_hoc: null,
  },
  {
    username: "3120226031",
    email: "nguyen.minh.an@ued.udn.vn",
    mssv: "3120226031",
    full_name: "Nguyễn Minh An",
    role: "user",
    is_ued_student: true,
    khoa: "Khoa Công nghệ & Khoa học Cơ bản",
    nganh: "Công nghệ thông tin",
    khoa_hoc: "K26",
  },
  {
    username: "3121925014",
    email: "tran.thu.ha@ued.udn.vn",
    mssv: "3121925014",
    full_name: "Trần Thu Hà",
    role: "user",
    is_ued_student: true,
    khoa: "Khoa Khoa học Xã hội & Nhân văn",
    nganh: "Sư phạm Ngữ văn",
    khoa_hoc: "K25",
  },
  {
    username: "3120124007",
    email: "le.quoc.bao@ued.udn.vn",
    mssv: "3120124007",
    full_name: "Lê Quốc Bảo",
    role: "user",
    is_ued_student: true,
    khoa: "Khoa Giáo dục",
    nganh: "Giáo dục Tiểu học",
    khoa_hoc: "K24",
  },
  {
    username: "3110123022",
    email: "pham.gia.huy@ued.udn.vn",
    mssv: "3110123022",
    full_name: "Phạm Gia Huy",
    role: "user",
    is_ued_student: true,
    khoa: "Khoa Xã hội & Quản lý",
    nganh: "Công tác Xã hội",
    khoa_hoc: "K23",
  },
  {
    username: "3120322009",
    email: "vo.thuy.linh@ued.udn.vn",
    mssv: "3120322009",
    full_name: "Võ Thùy Linh",
    role: "user",
    is_ued_student: true,
    khoa: "Khoa Công nghệ & Khoa học Cơ bản",
    nganh: "Khoa học dữ liệu",
    khoa_hoc: "K22",
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
  const anFinder = createdUsers.find((u) => u.username === "3120226031");
  const haSeeker = createdUsers.find((u) => u.username === "3121925014");
  const baoFinder = createdUsers.find((u) => u.username === "3120124007");
  const linhSeeker = createdUsers.find((u) => u.username === "3120322009");
  const huyPoster = createdUsers.find((u) => u.username === "3110123022");

  const items = await Item.insertMany([
    {
      title: "Tai nghe AirPods Pro",
      post_type: "FOUND",
      category: "Đồ Điện Tử",
      description:
        "Tai nghe màu trắng, hộp sạc còn pin, nhặt được tại sân bóng mini.",
      brand: "Apple",
      color: "Trắng",
      distinctive_features: "Vỏ hộp có vết xước nhỏ góc trái",
      contact_info: anFinder.email,
      location: "Sân bóng đá mini",
      date_lost_found: todayYMD(2),
      found_at: createDate(2, 17, 30).toISOString(),
      image_url: "https://picsum.photos/seed/chat-airpods/900/600",
      image_urls: [
        "https://picsum.photos/seed/chat-airpods/900/600",
        "https://picsum.photos/seed/chat-airpods-side/900/600",
        "https://picsum.photos/seed/chat-airpods-case/900/600",
      ],
      custody_type: "FINDER",
      status: "FOUND",
      user_id: anFinder._id,
      created_at: createDate(2, 18, 0),
    },
    {
      title: "Ví da đen",
      post_type: "FOUND",
      category: "Ví/Giấy tờ",
      description:
        "Ví da đen có thẻ sinh viên bên trong, nhặt được ở hành lang khu A.",
      brand: "Không rõ",
      color: "Đen",
      distinctive_features: "Có đường chỉ màu nâu sát mép",
      contact_info: baoFinder.email,
      location: "Giảng đường A - tầng 2",
      date_lost_found: todayYMD(1),
      found_at: createDate(1, 10, 45).toISOString(),
      image_url: "https://picsum.photos/seed/chat-wallet/900/600",
      image_urls: [
        "https://picsum.photos/seed/chat-wallet/900/600",
        "https://picsum.photos/seed/chat-wallet-open/900/600",
        "https://picsum.photos/seed/chat-wallet-card/900/600",
      ],
      custody_type: "ADMIN",
      status: "FOUND",
      user_id: baoFinder._id,
      created_at: createDate(1, 11, 15),
    },
    {
      title: "Laptop Dell XPS 13",
      post_type: "FOUND",
      category: "Đồ Điện Tử",
      description:
        "Laptop bạc có sticker nhỏ, đã được giao cho phòng công tác sinh viên.",
      brand: "Dell",
      color: "Bạc",
      distinctive_features: "Sticker nhỏ góc phải bàn phím",
      contact_info: admin.email,
      location: "Phòng máy tính",
      date_lost_found: todayYMD(5),
      found_at: createDate(5, 14, 0).toISOString(),
      image_url: "https://picsum.photos/seed/chat-laptop/900/600",
      image_urls: [
        "https://picsum.photos/seed/chat-laptop/900/600",
        "https://picsum.photos/seed/chat-laptop-keyboard/900/600",
        "https://picsum.photos/seed/chat-laptop-cover/900/600",
      ],
      custody_type: "ADMIN",
      status: "RETURNED",
      returned_at: createDate(1, 16, 30),
      user_id: baoFinder._id,
      created_at: createDate(5, 15, 10),
    },
    {
      title: "Mất thẻ sinh viên UED",
      post_type: "LOST",
      category: "Căn cước/Thẻ",
      description: "Mình bị mất thẻ sinh viên màu xanh, có bao thẻ nhựa trong.",
      brand: "UED",
      color: "Xanh",
      distinctive_features: "Bao thẻ trong có dây đeo xanh",
      contact_info: haSeeker.email,
      location: "Thư viện trung tâm",
      date_lost_found: todayYMD(3),
      lost_at: createDate(3, 9, 30).toISOString(),
      image_url: "https://picsum.photos/seed/chat-student-card-lost/900/600",
      image_urls: [
        "https://picsum.photos/seed/chat-student-card-lost/900/600",
        "https://picsum.photos/seed/chat-student-card-front/900/600",
        "https://picsum.photos/seed/chat-student-card-back/900/600",
      ],
      custody_type: "FINDER",
      status: "FOUND",
      user_id: haSeeker._id,
      created_at: createDate(3, 10, 0),
    },
    {
      title: "Mất balo đen",
      post_type: "LOST",
      category: "Khác",
      description: "Balo vải màu đen, bên trong có sổ tay và áo khoác mỏng.",
      brand: "Không rõ",
      color: "Đen",
      distinctive_features: "Móc khóa hình sao màu đỏ",
      contact_info: linhSeeker.email,
      location: "Sảnh nhà A",
      date_lost_found: todayYMD(4),
      lost_at: createDate(4, 8, 10).toISOString(),
      image_url: "https://picsum.photos/seed/chat-backpack-lost/900/600",
      image_urls: [
        "https://picsum.photos/seed/chat-backpack-lost/900/600",
        "https://picsum.photos/seed/chat-backpack-pocket/900/600",
        "https://picsum.photos/seed/chat-backpack-zipper/900/600",
      ],
      custody_type: "FINDER",
      status: "FOUND",
      user_id: linhSeeker._id,
      created_at: createDate(4, 9, 0),
    },
    {
      title: "Thẻ xe và chìa khóa",
      post_type: "FOUND",
      category: "Chìa Khoá",
      description: "Nhặt được bộ thẻ xe và chìa khóa ở bãi giữ xe sinh viên.",
      brand: "Honda",
      color: "Đen",
      distinctive_features: "Móc khóa hình gấu bông nhỏ",
      contact_info: huyPoster.email,
      location: "Bãi giữ xe sinh viên",
      date_lost_found: todayYMD(0),
      found_at: createDate(0, 12, 20).toISOString(),
      image_url: "https://picsum.photos/seed/chat-key/900/600",
      image_urls: [
        "https://picsum.photos/seed/chat-key/900/600",
        "https://picsum.photos/seed/chat-keyring/900/600",
        "https://picsum.photos/seed/chat-key-detail/900/600",
      ],
      custody_type: "FINDER",
      status: "FOUND",
      user_id: huyPoster._id,
      created_at: createDate(0, 12, 30),
    },
  ]);

  const airpodsFound = items.find((i) => i.title === "Tai nghe AirPods Pro");
  const walletAdmin = items.find((i) => i.title === "Ví da đen");
  const laptopReturned = items.find((i) => i.title === "Laptop Dell XPS 13");

  const claims = await Claim.insertMany([
    {
      item_id: airpodsFound._id,
      user_id: haSeeker._id,
      description:
        "Tôi có thể mô tả vết xước ở vỏ hộp sạc và mã serial trên iPhone đã kết nối.",
      status: "CONNECTED",
      created_at: createDate(1, 9, 20),
    },
    {
      item_id: walletAdmin._id,
      user_id: linhSeeker._id,
      description:
        "Tôi nhớ rõ trong ví có thẻ sinh viên và giấy biên lai màu hồng.",
      status: "PENDING",
      created_at: createDate(0, 14, 5),
    },
    {
      item_id: laptopReturned._id,
      user_id: haSeeker._id,
      description:
        "Tôi có thể xác nhận sticker và thông tin đăng nhập trong máy.",
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
      system_label: "Hệ thống",
      body: "Hệ thống đã kết nối người tìm và người nhặt. Hai bên vui lòng trao đổi để xác minh.",
      created_at: createDate(1, 9, 31),
    },
    {
      conversation_id: convoFinderSeeker._id,
      sender_id: haSeeker._id,
      body: "Chào bạn, mình nghĩ đây là AirPods của mình. Mình mô tả được vết xước ở vỏ hộp.",
      created_at: createDate(1, 9, 33),
    },
    {
      conversation_id: convoFinderSeeker._id,
      sender_id: anFinder._id,
      body: "Bạn gửi thêm mô tả vị trí vết xước và phụ kiện bên trong để mình đối chiếu nhé.",
      created_at: createDate(1, 9, 40),
    },
    {
      conversation_id: convoPendingAdmin._id,
      sender_id: null,
      is_system: true,
      system_label: "Hệ thống",
      body: "Yêu cầu nhận lại đã được tạo và gửi đến admin.",
      created_at: createDate(0, 14, 11),
    },
    {
      conversation_id: convoPendingAdmin._id,
      sender_id: linhSeeker._id,
      body: "Em đã gửi thông tin xác minh ví da. Mong admin hỗ trợ duyệt.",
      created_at: createDate(0, 14, 13),
    },
    {
      conversation_id: convoReturnedAdmin._id,
      sender_id: null,
      is_system: true,
      system_label: "Hệ thống",
      body: "Admin đã duyệt yêu cầu và ghi nhận xác nhận hoàn trả 2 chiều.",
      created_at: createDate(1, 16, 31),
    },
    {
      conversation_id: convoReturnedAdmin._id,
      sender_id: admin._id,
      body: "Hồ sơ đã hoàn tất. Cảm ơn bạn đã phối hợp xác nhận.",
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

  console.log("Đã tạo mới DB demo để test tính năng nhắn tin.");
  console.log("Tài khoản:");
  console.log(`- Admin: admin / ${ADMIN_PASSWORD}`);
  console.log(`- User chung: mật khẩu ${USER_PASSWORD}`);
  console.log("Danh sách user:");
  console.log("- 3120226031 (Nguyễn Minh An) - finder");
  console.log("- 3121925014 (Trần Thu Hà) - seeker");
  console.log("- 3120124007 (Lê Quốc Bảo) - finder");
  console.log("- 3120322009 (Võ Thùy Linh) - seeker");
  console.log("- 3110123022 (Phạm Gia Huy) - poster");
  console.log(
    `Items: ${items.length}, Claims: ${claims.length}, Conversations: ${conversations.length}`,
  );

  await mongoose.disconnect();
}

seedChatDemo().catch(async (error) => {
  console.error("Seed chat demo thất bại:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
