const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["INFO", "CLAIM_REQUEST", "FOUND_MATCH", "RETURN_CONFIRMED"],
      default: "INFO",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "", trim: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    is_read: { type: Boolean, default: false, index: true },
    created_at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
);

module.exports = mongoose.model("Notification", notificationSchema);
