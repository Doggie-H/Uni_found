const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Validate MSV format UED: 12 chữ số
const validateMSV = (msv) => {
  return /^\d{12}$/.test(msv);
};

const getValidKhoaHocRange = () => {
  const currentYear = new Date().getFullYear();
  return {
    minYear: currentYear - 8,
    maxYear: currentYear,
  };
};

const toKhoaHocCode = (year) => `K${String(year % 100).padStart(2, "0")}`;

// Parse MSV để lấy thông tin khóa học
// Cấu trúc MSV UED: KKKKNN...(6 đầu = mã khóa/ngành, 6 sau = số thứ tự)
const parseMSV = (msv) => {
  const yearCode = parseInt(msv.substring(0, 2)); // 2 số đầu ~ năm cuối (vd: 22 = 2022)
  const enrollYear = 2000 + yearCode;
  const khoaHoc = toKhoaHocCode(enrollYear);
  const { minYear, maxYear } = getValidKhoaHocRange();

  if (enrollYear < minYear || enrollYear > maxYear) {
    throw new Error(
      `Ma sinh vien khong hop le. Khoa hoc phai nam trong khoang ${toKhoaHocCode(minYear)}-${toKhoaHocCode(maxYear)} (sinh vien hoc toi da 8 nam).`,
    );
  }
  return { enrollYear, khoaHoc };
};

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Thong tin dang nhap khong hop le." });
  }

  User.findOne({ username: username.trim() })
    .select("+password")
    .then(async (user) => {
      if (!user) {
        return res.status(401).json({ message: "Sai thong tin dang nhap" });
      }

      const matched = await bcrypt.compare(password, user.password);
      if (!matched) {
        return res.status(401).json({ message: "Sai thong tin dang nhap" });
      }

      const token = jwt.sign(
        {
          sub: user._id.toString(),
          role: user.role,
          username: user.username,
        },
        process.env.JWT_SECRET || "change-this-secret",
        { expiresIn: "12h" },
      );

      return res.json({
        message: "Dang nhap thanh cong",
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          full_name: user.full_name,
          khoa: user.khoa,
          nganh: user.nganh,
          khoa_hoc: user.khoa_hoc,
          role: user.role,
        },
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

exports.register = (req, res) => {
  const { username, password, full_name, khoa, nganh } = req.body;

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof full_name !== "string"
  ) {
    return res.status(400).json({ error: "Du lieu dau vao khong hop le." });
  }

  // Admin không cần validate MSV
  // Sinh viên phải dùng MSV 12 chữ số
  const normalizedUsername = username.trim();
  const isAdmin = normalizedUsername === "admin";

  if (isAdmin) {
    return res
      .status(403)
      .json({ error: "Khong the tu dang ky tai khoan admin." });
  }

  if (!validateMSV(normalizedUsername)) {
    return res.status(400).json({
      error: "Ma sinh vien khong hop le. MSV UED phai co dung 12 chu so.",
    });
  }

  if (!full_name || full_name.trim().length < 3) {
    return res.status(400).json({ error: "Ho ten phai co it nhat 3 ky tu." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Mat khau phai co it nhat 6 ky tu." });
  }

  let khoaHoc;
  try {
    ({ khoaHoc } = parseMSV(normalizedUsername));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  bcrypt
    .hash(password, 10)
    .then((hashedPassword) =>
      User.create({
        username: normalizedUsername,
        password: hashedPassword,
        full_name: full_name.trim(),
        khoa: khoa || null,
        nganh: nganh || null,
        khoa_hoc: khoaHoc || null,
        role: "user",
      }),
    )
    .then((newUser) => {
      res.status(201).json({
        message: "Tao tai khoan thanh cong",
        user: {
          id: newUser._id.toString(),
          username: newUser.username,
          full_name: newUser.full_name,
          khoa: newUser.khoa,
          nganh: newUser.nganh,
          khoa_hoc: newUser.khoa_hoc,
          role: newUser.role,
        },
      });
    })
    .catch((err) => {
      if (err.code === 11000) {
        return res.status(400).json({
          error: "MSV nay da duoc dang ky. Moi MSV chi dung cho mot tai khoan.",
        });
      }
      if (err.name === "ValidationError") {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    });
};
