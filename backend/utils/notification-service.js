const Notification = require("../models/notification-model");
const User = require("../models/user-model");

const createNotificationForUser = async ({
  userId,
  type,
  title,
  body,
  meta,
}) => {
  if (!userId || !title) return null;

  return Notification.create({
    user_id: userId,
    type: type || "INFO",
    title,
    body: body || "",
    meta: meta && typeof meta === "object" ? meta : {},
  });
};

const notifyAdmins = async ({ type, title, body, meta }) => {
  if (!title) return 0;

  const admins = await User.find({ role: "admin" }).select("_id").lean();
  if (!admins.length) return 0;

  const docs = admins.map((admin) => ({
    user_id: admin._id,
    type: type || "INFO",
    title,
    body: body || "",
    meta: meta && typeof meta === "object" ? meta : {},
  }));

  const result = await Notification.insertMany(docs, { ordered: false });
  return Array.isArray(result) ? result.length : 0;
};

module.exports = {
  createNotificationForUser,
  notifyAdmins,
};
