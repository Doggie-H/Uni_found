const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    claim_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      default: null,
    },
    type: {
      type: String,
      enum: ["FINDER_SEEKER", "SEEKER_ADMIN"],
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

conversationSchema.index(
  { item_id: 1, claim_id: 1, type: 1 },
  { unique: true, name: "unique_conversation_per_claim_type" },
);

module.exports = mongoose.model("Conversation", conversationSchema);
