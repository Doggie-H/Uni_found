const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    post_type: {
      type: String,
      enum: ["FOUND", "LOST"],
      default: "FOUND",
    },
    category: { type: String, default: "Khác" },
    description: { type: String, default: "" },
    brand: { type: String, default: "" },
    color: { type: String, default: "" },
    distinctive_features: { type: String, default: "" },
    contact_info: { type: String, default: "" },
    location: { type: String, required: true, trim: true },
    lost_at: { type: String, default: null },
    found_at: { type: String, default: null },
    category_checklist: [{ type: String, default: "" }],
    date_lost_found: { type: String, default: null },
    image_url: { type: String, default: null },
    custody_type: {
      type: String,
      enum: ["FINDER", "ADMIN"],
      default: "FINDER",
    },
    status: { type: String, enum: ["FOUND", "RETURNED"], default: "FOUND" },
    approval_status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    returned_at: { type: Date, default: null },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

module.exports = mongoose.model("Item", itemSchema);
