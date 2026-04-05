const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();
const normalizeMssv = (mssv) => String(mssv || "").trim();

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// MSSV UED format: AA BBB CC DDD (10 digits)
// AA: 31 (school code), BBB: major internal code, CC: intake year (2 digits), DDD: serial
const validateMSV = (msv) => /^\d{10}$/.test(msv);

const getValidKhoaHocRange = () => {
  const currentYear = new Date().getFullYear();
  return {
    minYear: currentYear - 8,
    maxYear: currentYear,
  };
};

const toKhoaHocCode = (year) => `K${String(year % 100).padStart(2, "0")}`;

// Parse MSV để lấy thông tin khóa học
// Cấu trúc MSSV UED: AA BBB CC DDD
const parseMSV = (msv) => {
  if (!validateMSV(msv)) {
    throw new Error("Ma so sinh vien phai co dung 10 chu so.");
  }

  const schoolCode = msv.substring(0, 2);
  const majorCode = msv.substring(2, 5);
  const yearCode = parseInt(msv.substring(5, 7), 10);
  const serial = msv.substring(7, 10);

  if (schoolCode !== "31") {
    throw new Error("Ma so sinh vien khong hop le. Ma truong UED phai la 31.");
  }
  if (serial === "000") {
    throw new Error(
      "Ma so sinh vien khong hop le. So thu tu khong duoc la 000.",
    );
  }

  const enrollYear = 2000 + yearCode;
  const khoaHoc = toKhoaHocCode(enrollYear);
  const { minYear, maxYear } = getValidKhoaHocRange();

  if (enrollYear < minYear || enrollYear > maxYear) {
    throw new Error(
      `Ma sinh vien khong hop le. Khoa hoc phai nam trong khoang ${toKhoaHocCode(minYear)}-${toKhoaHocCode(maxYear)} (sinh vien hoc toi da 8 nam).`,
    );
  }
  return { enrollYear, khoaHoc, schoolCode, majorCode, serial };
};

exports.login = (req, res) => {
  const { identifier, username, email, password } = req.body;
  const rawIdentifier =
    typeof identifier === "string"
      ? identifier
      : typeof email === "string"
        ? email
        : username;

  if (typeof rawIdentifier !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Thong tin dang nhap khong hop le." });
  }

  const normalizedIdentifier = rawIdentifier.trim();
  const normalizedEmail = normalizeEmail(normalizedIdentifier);

  User.findOne({
    $or: [{ username: normalizedIdentifier }, { email: normalizedEmail }],
  })
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
          email: user.email,
          mssv: user.mssv,
          full_name: user.full_name,
          is_ued_student: user.is_ued_student,
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
  const { email, password, full_name, is_ued_student, khoa, nganh, mssv } =
    req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof full_name !== "string"
  ) {
    return res.status(400).json({ error: "Du lieu dau vao khong hop le." });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedMssv = normalizeMssv(mssv);
  const normalizedIsUedStudent =
    typeof is_ued_student === "boolean" ? is_ued_student : null;

  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ error: "Email khong hop le." });
  }

  if (!validateMSV(normalizedMssv)) {
    return res.status(400).json({
      error:
        "Ma so sinh vien khong hop le. MSSV UED phai theo dinh dang AA BBB CC DDD (10 chu so).",
    });
  }

  if (!full_name || full_name.trim().length < 3) {
    return res.status(400).json({ error: "Ho ten phai co it nhat 3 ky tu." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Mat khau phai co it nhat 6 ky tu." });
  }

  if (!khoa || !String(khoa).trim()) {
    return res.status(400).json({ error: "Vui long chon khoa." });
  }

  if (!nganh || !String(nganh).trim()) {
    return res.status(400).json({ error: "Vui long chon nganh hoc." });
  }

  let khoaHoc;
  try {
    ({ khoaHoc } = parseMSV(normalizedMssv));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  bcrypt
    .hash(password, 10)
    .then((hashedPassword) =>
      User.create({
        username: normalizedMssv,
        email: normalizedEmail,
        mssv: normalizedMssv,
        password: hashedPassword,
        full_name: full_name.trim(),
        is_ued_student: normalizedIsUedStudent,
        khoa: String(khoa).trim(),
        nganh: String(nganh).trim(),
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
          email: newUser.email,
          mssv: newUser.mssv,
          full_name: newUser.full_name,
          is_ued_student: newUser.is_ued_student,
          khoa: newUser.khoa,
          nganh: newUser.nganh,
          khoa_hoc: newUser.khoa_hoc,
          role: newUser.role,
        },
      });
    })
    .catch((err) => {
      if (err.code === 11000) {
        const duplicateKey = Object.keys(err.keyPattern || {})[0];
        if (duplicateKey === "email") {
          return res.status(400).json({
            error: "Email nay da duoc su dung. Vui long dung email khac.",
          });
        }
        if (duplicateKey === "mssv" || duplicateKey === "username") {
          return res.status(400).json({
            error:
              "MSSV nay da duoc dang ky. Moi MSSV chi dung cho mot tai khoan.",
          });
        }
        return res.status(400).json({
          error: "Thong tin dang ky da ton tai.",
        });
      }
      if (err.name === "ValidationError") {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    });
};
