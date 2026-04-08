const mongoose = require("mongoose");
const Item = require("../models/item-model");
const Claim = require("../models/claim-model");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toSafeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const getSortOption = (sortBy, order, allowed) => {
  const key = allowed.includes(sortBy) ? sortBy : "created_at";
  const direction = order === "asc" ? 1 : -1;
  return { [key]: direction };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PHONE_RE = /(?:\+84|0)(?:3|5|7|8|9)\d{8}\b/;
const URL_RE = /^https?:\/\//i;
const ITEM_IMAGE_MAX_COUNT = 5;

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

  if (normalized.includes("chia khoa") || normalized.includes("chia khoa")) {
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

const isValidContactInfo = (value) => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return (
    EMAIL_RE.test(trimmed) ||
    PHONE_RE.test(trimmed.replace(/[\s.-]/g, "")) ||
    URL_RE.test(trimmed) ||
    /^@[a-zA-Z0-9_.]{3,}$/.test(trimmed)
  );
};

const normalizeChecklist = (raw) => {
  if (!raw) return [];

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .slice(0, 12);
};

const getOwnerId = (userRef) => {
  if (!userRef) return null;
  if (typeof userRef === "string") return userRef;
  if (userRef._id) return userRef._id.toString();
  return userRef.toString ? userRef.toString() : null;
};

const toPostedBy = (userRef) => {
  if (!userRef || typeof userRef !== "object") return null;
  return {
    id: userRef._id?.toString?.() || null,
    username: userRef.username || null,
    full_name: userRef.full_name || null,
    khoa: userRef.khoa || null,
    nganh: userRef.nganh || null,
    khoa_hoc: userRef.khoa_hoc || null,
  };
};

const toClientItem = (item) => ({
  id: item._id.toString(),
  title: item.title,
  post_type: item.post_type || "FOUND",
  category: canonicalizeCategory(item.category),
  description: item.description,
  brand: item.brand || "",
  color: item.color || "",
  distinctive_features: item.distinctive_features || "",
  contact_info: item.contact_info || "",
  lost_at: item.lost_at || null,
  found_at: item.found_at || null,
  category_checklist: Array.isArray(item.category_checklist)
    ? item.category_checklist
    : [],
  location: item.location,
  date_lost_found: item.date_lost_found,
  image_url: item.image_url || item.image_urls?.[0] || null,
  image_urls: Array.isArray(item.image_urls)
    ? item.image_urls
    : item.image_url
      ? [item.image_url]
      : [],
  custody_type: item.custody_type || "FINDER",
  status: item.status,
  approval_status: item.approval_status || "PENDING",
  user_id: getOwnerId(item.user_id),
  posted_by: toPostedBy(item.user_id),
  created_at: item.created_at,
});

const assertOwner = (item, req) => {
  if (!item || !req?.user?.id) return false;
  return getOwnerId(item.user_id) === String(req.user.id);
};

// Lay danh sach items, co tim kiem + loc danh muc
exports.getItems = (req, res) => {
  const {
    keyword,
    location,
    category,
    status,
    post_type,
    page,
    limit,
    sortBy,
    order,
  } = req.query;
  const query = { approval_status: "APPROVED" };

  if (typeof keyword === "string" && keyword.trim()) {
    query.title = { $regex: escapeRegex(keyword.trim()), $options: "i" };
  }
  if (typeof location === "string" && location.trim()) {
    query.location = { $regex: escapeRegex(location.trim()), $options: "i" };
  }
  if (typeof category === "string" && category.trim()) {
    query.category = canonicalizeCategory(category);
  }
  if (typeof status === "string" && ["FOUND", "RETURNED"].includes(status)) {
    query.status = status;
  }
  if (typeof post_type === "string" && ["FOUND", "LOST"].includes(post_type)) {
    query.post_type = post_type;
  }

  const hasPagination = page !== undefined || limit !== undefined;
  const safePage = toSafeInt(page, 1);
  const safeLimit = Math.min(toSafeInt(limit, 12), 100);
  const sort = getSortOption(sortBy, order, [
    "created_at",
    "date_lost_found",
    "title",
    "status",
  ]);

  if (!hasPagination) {
    return Item.find(query)
      .populate("user_id", "username full_name khoa nganh khoa_hoc")
      .sort(sort)
      .lean()
      .then((rows) => res.json(rows.map(toClientItem)))
      .catch((err) => res.status(500).json({ error: err.message }));
  }

  Promise.all([
    Item.find(query)
      .populate("user_id", "username full_name khoa nganh khoa_hoc")
      .sort(sort)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Item.countDocuments(query),
  ])
    .then(([rows, total]) =>
      res.json({
        data: rows.map(toClientItem),
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        },
      }),
    )
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Lấy chi tiết 1 item
exports.getItemDetail = (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Khong tim thay item" });
  }

  Item.findById(id)
    .populate("user_id", "username full_name khoa nganh khoa_hoc")
    .lean()
    .then((row) => {
      if (!row) return res.status(404).json({ message: "Khong tim thay item" });
      return res.json(toClientItem(row));
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Tao 1 item moi
exports.createItem = (req, res) => {
  const {
    title,
    post_type,
    category,
    description,
    brand,
    color,
    distinctive_features,
    contact_info,
    lost_at,
    found_at,
    category_checklist,
    location,
    date_lost_found,
    image_url,
    custody_type,
  } = req.body;

  if (!title || !location) {
    return res.status(400).json({ error: "Thieu thong tin bat buoc." });
  }

  const normalizedTitle = String(title).trim();
  const normalizedLocation = String(location).trim();
  if (normalizedTitle.length < 3 || normalizedTitle.length > 120) {
    return res.status(400).json({ error: "Tieu de phai tu 3 den 120 ky tu." });
  }
  if (normalizedLocation.length < 3 || normalizedLocation.length > 200) {
    return res.status(400).json({ error: "Vi tri phai tu 3 den 200 ky tu." });
  }

  const normalizedDescription =
    typeof description === "string" ? description.trim() : "";
  if (
    normalizedDescription.length < 20 ||
    normalizedDescription.length > 1500
  ) {
    return res.status(400).json({
      error: "Mo ta chi tiet phai tu 20 den 1500 ky tu.",
    });
  }

  const normalizedFeatures =
    typeof distinctive_features === "string" ? distinctive_features.trim() : "";
  if (normalizedFeatures.length < 10 || normalizedFeatures.length > 1000) {
    return res.status(400).json({
      error: "Dac diem nhan dang phai tu 10 den 1000 ky tu.",
    });
  }

  const normalizedContact =
    typeof contact_info === "string" ? contact_info.trim() : "";
  if (normalizedContact.length < 8 || normalizedContact.length > 200) {
    return res.status(400).json({
      error: "Thong tin lien he phai tu 8 den 200 ky tu.",
    });
  }
  if (!isValidContactInfo(normalizedContact)) {
    return res.status(400).json({
      error:
        "Thong tin lien he phai la email, so dien thoai, URL hoac @username hop le.",
    });
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const uploadedFiles = [
    ...(Array.isArray(req.files?.images) ? req.files.images : []),
    ...(Array.isArray(req.files?.["images[]"]) ? req.files["images[]"] : []),
    ...(Array.isArray(req.files?.image) ? req.files.image : []),
  ].slice(0, ITEM_IMAGE_MAX_COUNT);

  const uploadedImageUrls = uploadedFiles.map(
    (file) =>
      `${req.protocol}://${req.get("host")}/uploads/items/${file.filename}`,
  );

  const manualImageUrl =
    typeof image_url === "string" && image_url.trim() ? image_url.trim() : null;

  const normalizedImageUrls = Array.from(
    new Set([
      ...uploadedImageUrls,
      ...(manualImageUrl ? [manualImageUrl] : []),
    ]),
  ).slice(0, ITEM_IMAGE_MAX_COUNT);

  const normalizedImageUrl = normalizedImageUrls[0] || null;
  const normalizedCustodyType = ["FINDER", "ADMIN"].includes(custody_type)
    ? custody_type
    : "FINDER";
  const normalizedPostType = ["FOUND", "LOST"].includes(post_type)
    ? post_type
    : "FOUND";
  const resolvedCustodyType =
    normalizedPostType === "LOST" ? "FINDER" : normalizedCustodyType;

  const normalizedLostAt =
    typeof lost_at === "string" && lost_at.trim() ? lost_at.trim() : null;
  const normalizedFoundAt =
    typeof found_at === "string" && found_at.trim() ? found_at.trim() : null;

  const primaryDate =
    normalizedPostType === "LOST" ? normalizedLostAt : normalizedFoundAt;

  const fallbackDate =
    typeof date_lost_found === "string" && date_lost_found.trim()
      ? date_lost_found.trim()
      : null;

  const dateValue = primaryDate || fallbackDate;
  if (!dateValue) {
    return res.status(400).json({
      error:
        normalizedPostType === "LOST"
          ? "Vui long cung cap thoi diem bi mat do."
          : "Vui long cung cap thoi diem nhat duoc do.",
    });
  }

  const parsedEventDate = new Date(dateValue);
  if (Number.isNaN(parsedEventDate.getTime())) {
    return res.status(400).json({
      error: "Thoi diem mat/nhat do khong hop le.",
    });
  }
  if (parsedEventDate > today) {
    return res.status(400).json({
      error: "Thoi diem mat/nhat do khong the nam trong tuong lai.",
    });
  }

  const normalizedChecklist = normalizeChecklist(category_checklist);

  Item.create({
    title: normalizedTitle,
    post_type: normalizedPostType,
    category: canonicalizeCategory(category),
    description: normalizedDescription,
    brand: typeof brand === "string" ? brand.trim().slice(0, 120) : "",
    color: typeof color === "string" ? color.trim().slice(0, 80) : "",
    distinctive_features: normalizedFeatures,
    contact_info: normalizedContact,
    lost_at: normalizedPostType === "LOST" ? dateValue : null,
    found_at: normalizedPostType === "FOUND" ? dateValue : null,
    category_checklist: normalizedChecklist,
    location: normalizedLocation,
    date_lost_found: dateValue,
    image_url: normalizedImageUrl,
    image_urls: normalizedImageUrls,
    custody_type: resolvedCustodyType,
    user_id: req.user.id,
    status: "FOUND",
    approval_status: "APPROVED",
  })
    .then((item) =>
      res
        .status(201)
        .json({ message: "Tao item thanh cong", item_id: item._id.toString() }),
    )
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Cap nhat trang thai item (danh cho admin)
exports.updateItem = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["FOUND", "RETURNED"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Trang thai khong hop le" });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Khong tim thay item" });
  }

  Item.findById(id)
    .then(async (item) => {
      if (!item) return res.status(404).json({ error: "Khong tim thay item" });

      item.status = status;
      item.returned_at = status === "RETURNED" ? new Date() : null;
      await item.save();

      if (status === "RETURNED") {
        await Claim.updateMany(
          { item_id: item._id, status: "CONNECTED" },
          { $set: { status: "RETURN_CONFIRMED" } },
        );
      }

      return res.json({ message: "Cap nhat thanh cong" });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Duyet/reject item (danh cho admin) - control visibility
exports.approveItem = (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Item khong hop le" });
  }

  Item.findByIdAndUpdate(id, { approval_status: "APPROVED" }, { new: true })
    .then((item) => {
      if (!item) return res.status(404).json({ error: "Khong tim thay item" });
      return res.json({
        message: "Da duyet item",
        item_id: item._id.toString(),
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

exports.rejectItem = (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Item khong hop le" });
  }

  Item.findByIdAndUpdate(id, { approval_status: "REJECTED" }, { new: true })
    .then((item) => {
      if (!item) return res.status(404).json({ error: "Khong tim thay item" });
      return res.json({ message: "Da huy item", item_id: item._id.toString() });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Lay danh sach items can duyet (cho admin)
exports.getPendingItems = (req, res) => {
  Item.find({ approval_status: "PENDING" })
    .populate("user_id", "username full_name khoa nganh khoa_hoc")
    .sort({ created_at: -1 })
    .lean()
    .then((rows) => res.json(rows.map(toClientItem)))
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Lay danh sach bai dang cua chinh nguoi dung (ca LOST va FOUND)
exports.getMyItems = (req, res) => {
  const { post_type, approval_status, status } = req.query;
  const query = { user_id: req.user.id };

  if (typeof post_type === "string" && ["FOUND", "LOST"].includes(post_type)) {
    query.post_type = post_type;
  }
  if (
    typeof approval_status === "string" &&
    ["PENDING", "APPROVED", "REJECTED"].includes(approval_status)
  ) {
    query.approval_status = approval_status;
  }
  if (typeof status === "string" && ["FOUND", "RETURNED"].includes(status)) {
    query.status = status;
  }

  Item.find(query)
    .populate("user_id", "username full_name khoa nganh khoa_hoc")
    .sort({ created_at: -1 })
    .lean()
    .then((rows) => res.json(rows.map(toClientItem)))
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Nguoi dang bai tu cap nhat trang thai da tim thay/da hoan tat
exports.updateMyItemStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Khong tim thay item" });
  }
  if (!["FOUND", "RETURNED"].includes(status)) {
    return res.status(400).json({ error: "Trang thai khong hop le" });
  }

  Item.findById(id)
    .then(async (item) => {
      if (!item) return res.status(404).json({ error: "Khong tim thay item" });
      if (!assertOwner(item, req)) {
        return res
          .status(403)
          .json({ error: "Ban khong co quyen cap nhat bai dang nay." });
      }

      item.status = status;
      item.returned_at = status === "RETURNED" ? new Date() : null;
      await item.save();

      let affectedClaims = 0;
      if (status === "RETURNED") {
        const now = new Date();
        const updateResult = await Claim.updateMany(
          { item_id: item._id, status: "CONNECTED" },
          {
            $set: {
              status: "RETURN_CONFIRMED",
              returned_confirmed_at: now,
              seeker_confirmed: true,
              holder_confirmed: true,
            },
          },
        );
        affectedClaims = updateResult.modifiedCount || 0;
      }

      return res.json({
        message:
          status === "RETURNED"
            ? "Da xac nhan hoan tra va gui thong bao den admin."
            : "Da cap nhat trang thai",
        item_id: item._id.toString(),
        admin_notified: status === "RETURNED",
        affected_claims: affectedClaims,
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Nguoi dang bai co the xoa bai cua minh
exports.deleteMyItem = (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Khong tim thay item" });
  }

  Item.findById(id)
    .then(async (item) => {
      if (!item) return res.status(404).json({ error: "Khong tim thay item" });
      if (!assertOwner(item, req)) {
        return res
          .status(403)
          .json({ error: "Ban khong co quyen xoa bai dang nay." });
      }

      await Item.deleteOne({ _id: item._id });
      await Claim.deleteMany({ item_id: item._id });
      return res.json({ message: "Da xoa bai dang cua ban" });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Xoa item (danh cho admin)
exports.deleteItem = (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Khong tim thay item" });
  }

  Item.findByIdAndDelete(id)
    .then(async (deleted) => {
      if (!deleted)
        return res.status(404).json({ error: "Khong tim thay item" });

      await Claim.deleteMany({ item_id: deleted._id });
      return res.json({ message: "Da xoa item" });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};
