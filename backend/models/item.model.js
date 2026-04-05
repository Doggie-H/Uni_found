const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "Khác" },
    description: { type: String, default: "" },
    location: { type: String, required: true, trim: true },
    date_lost_found: { type: String, default: null },
    image_url: { type: String, default: null },
    status: { type: String, enum: ["FOUND", "RETURNED"], default: "FOUND" },
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
