const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

claimSchema.index(
  { item_id: 1, user_id: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" },
    name: "unique_pending_claim_per_user_item",
  },
);

module.exports = mongoose.model("Claim", claimSchema);
