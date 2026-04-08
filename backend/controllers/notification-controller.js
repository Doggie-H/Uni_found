const mongoose = require("mongoose");
const Notification = require("../models/notification-model");

const toSafeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

exports.getMyNotifications = async (req, res) => {
  try {
    const { unreadOnly, page, limit } = req.query;

    const query = { user_id: req.user.id };
    if (String(unreadOnly).toLowerCase() === "true") {
      query.is_read = false;
    }

    const safePage = toSafeInt(page, 1);
    const safeLimit = Math.min(toSafeInt(limit, 20), 100);

    const [rows, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ created_at: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user_id: req.user.id, is_read: false }),
    ]);

    return res.json({
      data: rows.map((row) => ({
        id: row._id.toString(),
        type: row.type,
        title: row.title,
        body: row.body,
        meta: row.meta || {},
        is_read: Boolean(row.is_read),
        created_at: row.created_at,
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Thong bao khong hop le." });
  }

  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: id, user_id: req.user.id },
      { $set: { is_read: true } },
      { new: true },
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Khong tim thay thong bao." });
    }

    return res.json({ message: "Da danh dau da doc." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user_id: req.user.id, is_read: false },
      { $set: { is_read: true } },
    );

    return res.json({
      message: "Da danh dau tat ca thong bao da doc.",
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
