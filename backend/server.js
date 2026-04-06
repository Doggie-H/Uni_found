const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const { connectDatabase } = require("./database");
const authRoutes = require("./routes/auth-routes");
const analyticsRoutes = require("./routes/analytics-routes");
const itemRoutes = require("./routes/item-routes");
const claimRoutes = require("./routes/claim-routes");
const userRoutes = require("./routes/user-routes");
const messageRoutes = require("./routes/message-routes");

const app = express();
const PORT = process.env.PORT || 3000;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: false,
  }),
);
app.use(express.json());
app.use("/api", apiLimiter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  if (
    err?.message?.includes("PNG/JPG/JPEG") ||
    err?.code === "LIMIT_FILE_SIZE"
  ) {
    return res.status(400).json({
      error:
        err.code === "LIMIT_FILE_SIZE"
          ? "Anh vuot qua gioi han 5MB."
          : err.message,
    });
  }
  res.status(500).json({ error: "Internal server error" });
});

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server Backend dang chay tai http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Khong the khoi dong server:", error.message);
    process.exit(1);
  }
};

startServer();
