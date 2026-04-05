const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    event_type: {
      type: String,
      enum: ["page_view"],
      default: "page_view",
    },
    path: { type: String, default: "/" },
    referrer: { type: String, default: null },
    visitor_id: { type: String, default: null },
    session_id: { type: String, default: null },
    user_agent: { type: String, default: null },
    source: { type: String, default: "web" },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

visitSchema.index({ created_at: 1 });
visitSchema.index({ event_type: 1, created_at: 1 });
visitSchema.index({ visitor_id: 1, created_at: 1 }, { sparse: true });
visitSchema.index({ session_id: 1, created_at: 1 }, { sparse: true });
visitSchema.index(
  { event_type: 1, visitor_id: 1, session_id: 1, path: 1, created_at: -1 },
  { sparse: true },
);

module.exports = mongoose.model("Visit", visitSchema);
