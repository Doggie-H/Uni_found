const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    is_system: { type: Boolean, default: false },
    system_label: { type: String, default: "He thong" },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

messageSchema.index({ conversation_id: 1, created_at: 1 });

module.exports = mongoose.model("Message", messageSchema);
