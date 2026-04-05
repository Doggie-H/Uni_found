const mongoose = require("mongoose");
const Claim = require("../models/claim.model");
const Item = require("../models/item.model");
const toSafeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const getSortOption = (sortBy, order, allowed) => {
  const key = allowed.includes(sortBy) ? sortBy : "created_at";
  const direction = order === "asc" ? 1 : -1;
  return { [key]: direction };
};

// Tạo mới 1 claim cho item
exports.createClaim = (req, res) => {
  const { item_id, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(item_id)) {
    return res.status(400).json({ error: "Item khong hop le." });
  }

  Item.findById(item_id)
    .lean()
    .then((item) => {
      if (!item) {
        return res.status(404).json({ error: "Khong tim thay item." });
      }
      if (item.status !== "FOUND") {
        return res
          .status(400)
          .json({ error: "Item da duoc tra, khong the claim." });
      }
      if (item.user_id?.toString() === req.user.id) {
        return res
          .status(400)
          .json({ error: "Ban khong the claim mon do do chinh minh dang." });
      }

      const normalizedDescription =
        typeof description === "string" ? description.trim() : "";
      if (normalizedDescription.length < 10) {
        return res
          .status(400)
          .json({ error: "Mo ta xac minh can it nhat 10 ky tu." });
      }
      if (normalizedDescription.length > 1000) {
        return res
          .status(400)
          .json({ error: "Mo ta xac minh qua dai (toi da 1000 ky tu)." });
      }

      return Claim.findOne({ item_id, user_id: req.user.id, status: "PENDING" })
        .lean()
        .then((existingPendingClaim) => {
          if (existingPendingClaim) {
            return res.status(400).json({
              error: "Ban da gui claim cho item nay va dang cho duyet.",
            });
          }

          return Claim.create({
            item_id,
            user_id: req.user.id,
            description: normalizedDescription,
            status: "PENDING",
          }).then((newClaim) =>
            res.status(201).json({
              message: "Gui yeu cau nhan do thanh cong",
              claim_id: newClaim._id.toString(),
            }),
          );
        });
    })
    .catch((err) => {
      if (err?.code === 11000) {
        return res
          .status(400)
          .json({ error: "Ban da gui claim cho item nay va dang cho duyet." });
      }
      return res.status(500).json({ error: err.message });
    });
};

// Lấy danh sách toàn bộ claims (kèm thông tin Item và User) cho màn Admin
exports.getClaims = (req, res) => {
  const { status, page, limit, sortBy, order } = req.query;
  const query = {};
  if (
    typeof status === "string" &&
    ["PENDING", "APPROVED", "REJECTED"].includes(status)
  ) {
    query.status = status;
  }

  const hasPagination = page !== undefined || limit !== undefined;
  const safePage = toSafeInt(page, 1);
  const safeLimit = Math.min(toSafeInt(limit, 20), 100);
  const sort = getSortOption(sortBy, order, ["created_at", "status"]);

  const mapper = (claim) => ({
    id: claim._id.toString(),
    item_id: claim.item_id?._id?.toString?.() || null,
    user_id: claim.user_id?._id?.toString?.() || null,
    description: claim.description,
    status: claim.status,
    created_at: claim.created_at,
    item_title: claim.item_id?.title || "Khong ro",
    claimer_username: claim.user_id?.username || "Khong ro",
  });

  if (!hasPagination) {
    return Claim.find(query)
      .populate("item_id", "title")
      .populate("user_id", "username")
      .sort(sort)
      .lean()
      .then((rows) => res.json(rows.map(mapper)))
      .catch((err) => res.status(500).json({ error: err.message }));
  }

  Promise.all([
    Claim.find(query)
      .populate("item_id", "title")
      .populate("user_id", "username")
      .sort(sort)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Claim.countDocuments(query),
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

// Admin duyệt (approve) hoặc từ chối (reject) Claim
exports.updateClaimStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'APPROVED' hoặc 'REJECTED'

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "Trang thai claim khong hop le." });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Claim not found" });
  }

  Claim.findOneAndUpdate(
    { _id: id, status: "PENDING" },
    { $set: { status } },
    { new: true },
  )
    .then((savedClaim) => {
      if (!savedClaim) {
        return Claim.findById(id)
          .lean()
          .then((existingClaim) => {
            if (!existingClaim) {
              return res.status(404).json({ error: "Claim not found" });
            }
            return res
              .status(409)
              .json({ error: "Claim da duoc xu ly truoc do." });
          });
      }

      return Promise.resolve().then(async () => {
        if (status === "APPROVED") {
          await Item.findByIdAndUpdate(savedClaim.item_id, {
            status: "RETURNED",
            returned_at: new Date(),
          });
          await Claim.updateMany(
            {
              _id: { $ne: savedClaim._id },
              item_id: savedClaim.item_id,
              status: "PENDING",
            },
            { $set: { status: "REJECTED" } },
          );

          return res.json({
            message:
              "Da duyet yeu cau va cap nhat trang thai mon do la RETURNED.",
          });
        }

        return res.json({ message: "Da tu choi yeu cau." });
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};
