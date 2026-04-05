const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ error: "Ban chua dang nhap hoac phien da het han." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "change-this-secret",
    );
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      username: decoded.username,
    };
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Token khong hop le hoac da het han." });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Ban khong co quyen truy cap chuc nang nay." });
  }
  return next();
};

module.exports = { authenticate, requireAdmin };
