const mongoose = require("mongoose");

const getValidKhoaHocRange = () => {
  const currentYear = new Date().getFullYear();
  return {
    minYear: currentYear - 8,
    maxYear: currentYear,
  };
};

const toKhoaHocCode = (year) => `K${String(year % 100).padStart(2, "0")}`;

// Validate khoa_hoc format and enforce max 8 years of study window.
const validateKhoaHoc = (value) => {
  if (!value) return true; // Allow null/undefined

  // Check format: K + 2 digits
  const regex = /^K(\d{2})$/;
  const match = value.match(regex);

  if (!match) return false;

  const yearCode = parseInt(match[1]);
  const year = 2000 + yearCode;
  const { minYear, maxYear } = getValidKhoaHocRange();

  return year >= minYear && year <= maxYear;
};

const getKhoaHocValidationMessage = () => {
  const { minYear, maxYear } = getValidKhoaHocRange();
  return `Khoa hoc phai co dang ${toKhoaHocCode(minYear)}-${toKhoaHocCode(maxYear)} (sinh vien hoc toi da 8 nam).`;
};

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    mssv: {
      type: String,
      default: null,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: { type: String, required: true, select: false },
    full_name: { type: String, required: true, trim: true },
    is_ued_student: { type: Boolean, default: null },
    khoa: { type: String, default: null },
    nganh: { type: String, default: null },
    khoa_hoc: {
      type: String,
      default: null,
      validate: {
        validator: validateKhoaHoc,
        message: getKhoaHocValidationMessage,
      },
    },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

module.exports = mongoose.model("User", userSchema);
