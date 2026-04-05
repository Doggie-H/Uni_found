const mongoose = require("mongoose");
const Item = require("../models/item.model");
const Claim = require("../models/claim.model");

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

const toClientItem = (item) => ({
  id: item._id.toString(),
  title: item.title,
  category: item.category,
  description: item.description,
  location: item.location,
  date_lost_found: item.date_lost_found,
  image_url: item.image_url,
  status: item.status,
  user_id: item.user_id?.toString ? item.user_id.toString() : item.user_id,
  created_at: item.created_at,
});

// Lấy danh sách items, có tìm kiếm + lọc danh mục
exports.getItems = (req, res) => {
  const { keyword, location, category, status, page, limit, sortBy, order } =
    req.query;
  const query = {};

  if (typeof keyword === "string" && keyword.trim()) {
    query.title = { $regex: escapeRegex(keyword.trim()), $options: "i" };
  }
  if (typeof location === "string" && location.trim()) {
    query.location = { $regex: escapeRegex(location.trim()), $options: "i" };
  }
  if (typeof category === "string" && category.trim()) {
    query.category = category.trim();
  }
  if (typeof status === "string" && ["FOUND", "RETURNED"].includes(status)) {
    query.status = status;
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
      .sort(sort)
      .lean()
      .then((rows) => res.json(rows.map(toClientItem)))
      .catch((err) => res.status(500).json({ error: err.message }));
  }

  Promise.all([
    Item.find(query)
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
    .lean()
    .then((row) => {
      if (!row) return res.status(404).json({ message: "Khong tim thay item" });
      return res.json(toClientItem(row));
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Tạo 1 item mới
exports.createItem = (req, res) => {
  const { title, category, description, location, date_lost_found, image_url } =
    req.body;

  if (!title || !location || !date_lost_found) {
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

  const parsedDate = new Date(date_lost_found);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: "Ngay nhat/mat do khong hop le." });
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsedDate > today) {
    return res
      .status(400)
      .json({ error: "Ngay nhat/mat do khong the nam trong tuong lai." });
  }

  Item.create({
    title: normalizedTitle,
    category: category || "Khác",
    description:
      typeof description === "string" ? description.trim().slice(0, 1500) : "",
    location: normalizedLocation,
    date_lost_found,
    image_url:
      typeof image_url === "string" && image_url.trim()
        ? image_url.trim()
        : null,
    user_id: req.user.id,
    status: "FOUND",
  })
    .then((item) =>
      res
        .status(201)
        .json({ message: "Tao item thanh cong", item_id: item._id.toString() }),
    )
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Cập nhật trạng thái item (dành cho admin)
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
          { item_id: item._id, status: "PENDING" },
          { $set: { status: "REJECTED" } },
        );
      }

      return res.json({ message: "Cap nhat thanh cong" });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Xóa item (dành cho admin)
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
