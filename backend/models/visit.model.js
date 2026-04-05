const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    path: { type: String, default: "/" },
    referrer: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

visitSchema.index({ created_at: 1 });

module.exports = mongoose.model("Visit", visitSchema);
