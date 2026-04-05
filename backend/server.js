const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { connectDatabase } = require("./database");
const authRoutes = require("./routes/auth.routes");
const itemRoutes = require("./routes/item.routes");
const claimRoutes = require("./routes/claim.routes");
const userRoutes = require("./routes/user.routes");

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

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/users", userRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
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
