const mongoose = require("mongoose");
const User = require("../models/user.model");
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

// GET all users (admin only)
exports.getUsers = (req, res) => {
  const { search, role, page, limit, sortBy, order } = req.query;
  const query = {};
  if (typeof role === "string" && ["admin", "user"].includes(role)) {
    query.role = role;
  }
  if (typeof search === "string" && search.trim()) {
    const term = escapeRegex(search.trim());
    query.$or = [
      { username: { $regex: term, $options: "i" } },
      { full_name: { $regex: term, $options: "i" } },
      { khoa: { $regex: term, $options: "i" } },
      { nganh: { $regex: term, $options: "i" } },
    ];
  }

  const hasPagination = page !== undefined || limit !== undefined;
  const safePage = toSafeInt(page, 1);
  const safeLimit = Math.min(toSafeInt(limit, 12), 100);
  const sort = getSortOption(sortBy, order, [
    "created_at",
    "username",
    "full_name",
    "role",
  ]);

  const mapper = (u) => ({
    id: u._id.toString(),
    username: u.username,
    full_name: u.full_name,
    khoa: u.khoa,
    nganh: u.nganh,
    khoa_hoc: u.khoa_hoc,
    role: u.role,
    created_at: u.created_at,
  });

  if (!hasPagination) {
    return User.find(query)
      .sort(sort)
      .lean()
      .then((rows) => res.json(rows.map(mapper)))
      .catch((err) => res.status(500).json({ error: err.message }));
  }

  Promise.all([
    User.find(query)
      .sort(sort)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    User.countDocuments(query),
  ])
    .then(([rows, total]) =>
      res.json({
        data: rows.map(mapper),
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

// DELETE a user (admin cannot delete themselves)
exports.deleteUser = (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Khong tim thay nguoi dung." });
  }

  if (req.user.id === id) {
    return res
      .status(403)
      .json({ error: "Ban khong the tu xoa tai khoan cua chinh minh." });
  }

  User.findById(id)
    .lean()
    .then(async (targetUser) => {
      if (!targetUser) {
        return res.status(404).json({ error: "Khong tim thay nguoi dung." });
      }

      if (targetUser.username === "admin" || targetUser.role === "admin") {
        return res
          .status(403)
          .json({ error: "Khong the xoa tai khoan Admin." });
      }

      const ownedItems = await Item.find({ user_id: id }).select("_id").lean();
      const ownedItemIds = ownedItems.map((item) => item._id);

      if (ownedItemIds.length > 0) {
        await Claim.deleteMany({ item_id: { $in: ownedItemIds } });
        await Item.deleteMany({ _id: { $in: ownedItemIds } });
      }

      await Claim.deleteMany({ user_id: id });
      await User.findByIdAndDelete(id);

      return res.json({ message: "Da xoa nguoi dung thanh cong." });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};
