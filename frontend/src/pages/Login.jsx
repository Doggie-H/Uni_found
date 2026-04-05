import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  User,
  Lock,
  GraduationCap,
  BookOpen,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import BrandMark from "../components/ui/BrandMark";

// =====================================================
// Dữ liệu khoa + ngành UED (nguồn: tuyensinh.ued.udn.vn)
// =====================================================
const UED_DEPARTMENTS = [
  {
    khoa: "Khoa Giáo dục",
    nganh: [
      "Công nghệ giáo dục",
      "Hỗ trợ Giáo dục người khuyết tật",
      "Giáo dục Tiểu học",
      "Giáo dục Mầm non",
      "Giáo dục Thể chất",
      "Sư phạm Âm nhạc",
      "Sư phạm Mỹ thuật",
    ],
  },
  {
    khoa: "Khoa Khoa học Tự nhiên & STEM",
    nganh: [
      "Sư phạm Toán học",
      "Sư phạm Tin học",
      "Sư phạm Vật lý",
      "Sư phạm Hóa học",
      "Sư phạm Sinh học",
      "Sư phạm Khoa học Tự nhiên",
      "Sư phạm Tin học và Công nghệ Tiểu học",
    ],
  },
  {
    khoa: "Khoa Khoa học Xã hội & Nhân văn",
    nganh: [
      "Sư phạm Ngữ văn",
      "Sư phạm Lịch sử",
      "Sư phạm Địa lý",
      "Sư phạm Lịch sử – Địa lý",
      "Giáo dục Công dân",
      "Giáo dục Chính trị",
      "Giáo dục Pháp luật",
    ],
  },
  {
    khoa: "Khoa Công nghệ & Khoa học Cơ bản",
    nganh: [
      "Công nghệ thông tin",
      "Khoa học dữ liệu",
      "Vật lý Kỹ thuật",
      "Hóa phân tích và ứng dụng",
      "Hóa dược",
      "Công nghệ Sinh học",
      "Nông nghiệp thông minh",
    ],
  },
  {
    khoa: "Khoa Xã hội & Quản lý",
    nganh: [
      "Tâm lý học",
      "Công tác Xã hội",
      "Quản lý Tài nguyên – Môi trường",
      "Quan hệ quốc tế",
      "Quan hệ công chúng",
      "Báo chí",
      "Văn học",
      "Văn hóa học",
      "Văn hóa – Du lịch",
      "Địa lý Du lịch",
    ],
  },
];

// Parse khóa học từ MSV (2 chữ số đầu ~ năm入学)
const parseMSV = (msv) => {
  if (!msv || msv.length < 2) return "";
  const yearCode = parseInt(msv.substring(0, 2));
  return `K${yearCode}`;
};

const Login = () => {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [showPass, setShowPass] = useState(false);

  // Login fields
  const [msv, setMsv] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regMsv, setRegMsv] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedKhoa, setSelectedKhoa] = useState("");
  const [selectedNganh, setSelectedNganh] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Tính khóa học tự động từ MSV
  const khoaHoc = parseMSV(regMsv);
  const availableNganh =
    UED_DEPARTMENTS.find((d) => d.khoa === selectedKhoa)?.nganh || [];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!msv || !password) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setLoading(true);
    try {
      const loggedInUser = await login(msv, password);
      if (loggedInUser.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError(err.message || "Sai MSV hoặc mật khẩu. Vui lòng kiểm tra lại.");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{12}$/.test(regMsv)) {
      setError("Mã sinh viên phải là 12 chữ số.");
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError("Họ tên phải ít nhất 3 ký tự.");
      return;
    }
    if (!selectedKhoa) {
      setError("Vui lòng chọn khoa.");
      return;
    }
    if (!selectedNganh) {
      setError("Vui lòng chọn ngành.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Mật khẩu phải ít nhất 6 ký tự.");
      return;
    }
    if (regPassword !== regPassword2) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      const ok = await register(
        regMsv,
        regPassword,
        fullName.trim(),
        selectedKhoa,
        selectedNganh,
      );
      if (ok) {
        setSuccess("Đăng ký thành công! Đang đăng nhập...");
        setTimeout(async () => {
          await login(regMsv, regPassword);
          navigate("/");
        }, 1200);
      }
    } catch (err) {
      setError(err?.message || "Đăng ký thất bại. MSV có thể đã được đăng ký.");
      setLoading(false);
    }
  };

  return (
    <div
      className="login-shell"
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "var(--bg)",
      }}
    >
      {/* Cột trái — Brand panel */}
      <div
        className="login-brand"
        style={{
          background: "var(--white)",
          padding: "64px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative dot grid — tinh tế, không blob */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(13,13,13,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <div style={{ position: "relative" }}>
          <div style={{ marginBottom: "64px" }}>
            <BrandMark />
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-head)",
              fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
              fontWeight: 700,
              color: "var(--ink)",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              marginBottom: "20px",
            }}
          >
            Hệ thống tìm đồ
            <br />
            <span style={{ color: "var(--red)" }}>dành riêng</span>
            <br />
            cho sinh viên UED
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "1rem",
              lineHeight: 1.7,
              maxWidth: "340px",
            }}
          >
            Chỉ sinh viên Trường ĐH Sư phạm – ĐH Đà Nẵng mới có thể tạo tài
            khoản. Mỗi MSV được dùng cho một tài khoản duy nhất.
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          {[
            { n: "38+", label: "Ngành đào tạo" },
            { n: "100%", label: "Sinh viên xác thực" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-head)",
                  color: "var(--ink)",
                  lineHeight: 1,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  marginTop: "6px",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cột phải — Form */}
      <div
        className="login-form"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 56px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {/* Tab switch */}
          <div
            style={{
              display: "flex",
              background: "var(--surface)",
              borderRadius: "var(--r-lg)",
              padding: "4px",
              marginBottom: "36px",
            }}
          >
            {[
              ["login", "Đăng nhập"],
              ["register", "Đăng ký"],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => {
                  setMode(v);
                  setError("");
                  setSuccess("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: mode === v ? "var(--white)" : "transparent",
                  color: mode === v ? "var(--ink)" : "var(--muted)",
                  boxShadow: mode === v ? "var(--shadow-sm)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Alert */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                background: "var(--red-bg)",
                color: "var(--red)",
                border: "1px solid rgba(232,57,42,0.2)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                marginBottom: "20px",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              <AlertCircle
                size={16}
                style={{ flexShrink: 0, marginTop: "1px" }}
              />
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--green-bg)",
                color: "var(--green)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                marginBottom: "20px",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          {/* ===== LOGIN FORM ===== */}
          {mode === "login" && (
            <form onSubmit={handleLogin}>
              <h2
                style={{
                  fontFamily: "var(--font-head)",
                  fontSize: "1.625rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                  letterSpacing: "-0.02em",
                }}
              >
                Chào mừng trở lại
              </h2>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "0.9rem",
                  marginBottom: "28px",
                }}
              >
                Sinh viên dùng MSV · Quản trị viên dùng tên tài khoản
              </p>

              <div className="form-group">
                <label className="form-label">
                  <GraduationCap size={15} /> Mã sinh viên (MSV)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="MSV 12 chữ số hoặc tên tài khoản"
                  value={msv}
                  maxLength={30}
                  onChange={(e) => setMsv(e.target.value)}
                  autoComplete="username"
                  style={{ fontFamily: "var(--font-head)", fontSize: "1rem" }}
                />
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--muted)",
                    marginTop: "5px",
                  }}
                >
                  Sinh viên: MSV 12 chữ số &nbsp;·&nbsp; Admin:{" "}
                  <code
                    style={{
                      background: "var(--surface)",
                      padding: "1px 5px",
                      borderRadius: "3px",
                    }}
                  >
                    admin
                  </code>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "28px" }}>
                <label className="form-label">
                  <Lock size={15} /> Mật khẩu
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    className="input"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? "An mat khau" : "Hien mat khau"}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={loading}
              >
                {loading ? (
                  "Đang đăng nhập..."
                ) : (
                  <>
                    Đăng nhập <ChevronRight size={16} />
                  </>
                )}
              </button>

              <p
                style={{
                  textAlign: "center",
                  marginTop: "20px",
                  fontSize: "0.875rem",
                  color: "var(--muted)",
                }}
              >
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--blue)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Đăng ký ngay
                </button>
              </p>

              <div
                style={{
                  marginTop: "28px",
                  padding: "14px",
                  background: "var(--surface)",
                  borderRadius: "var(--r-md)",
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                }}
              >
                <strong style={{ color: "var(--ink)" }}>
                  Tài khoản Admin:
                </strong>{" "}
                admin / admin123456 (hoặc mật khẩu trong file .env)
              </div>
            </form>
          )}

          {/* ===== REGISTER FORM ===== */}
          {mode === "register" && (
            <form onSubmit={handleRegister}>
              <h2
                style={{
                  fontFamily: "var(--font-head)",
                  fontSize: "1.625rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                  letterSpacing: "-0.02em",
                }}
              >
                Tạo tài khoản
              </h2>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "0.9rem",
                  marginBottom: "24px",
                }}
              >
                Chỉ dành cho sinh viên UED · MSV dùng để xác thực danh tính
              </p>

              {/* MSV */}
              <div className="form-group">
                <label className="form-label">
                  <GraduationCap size={15} /> Mã sinh viên (12 số)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="316011XXXXXX"
                  value={regMsv}
                  maxLength={12}
                  onChange={(e) => setRegMsv(e.target.value.replace(/\D/g, ""))}
                  style={{
                    fontFamily: "var(--font-head)",
                    letterSpacing: "0.1em",
                    fontSize: "1.0625rem",
                  }}
                />
                {regMsv.length >= 2 && (
                  <div style={{ marginTop: "5px", fontSize: "0.8rem" }}>
                    <span
                      style={{
                        background: "var(--blue-bg)",
                        color: "var(--blue)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 600,
                      }}
                    >
                      {khoaHoc}
                    </span>
                    <span style={{ color: "var(--muted)", marginLeft: "8px" }}>
                      Tự động nhận diện khóa học
                    </span>
                  </div>
                )}
                {regMsv.length > 0 && regMsv.length < 12 && (
                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "0.78rem",
                      color: "var(--muted)",
                    }}
                  >
                    {12 - regMsv.length} chữ số còn thiếu
                  </div>
                )}
              </div>

              {/* Họ tên */}
              <div className="form-group">
                <label className="form-label">
                  <User size={15} /> Họ và tên đầy đủ
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Khoa */}
              <div className="form-group">
                <label className="form-label">
                  <BookOpen size={15} /> Khoa
                </label>
                <select
                  className="input"
                  value={selectedKhoa}
                  onChange={(e) => {
                    setSelectedKhoa(e.target.value);
                    setSelectedNganh("");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <option value="">-- Chọn khoa --</option>
                  {UED_DEPARTMENTS.map((d) => (
                    <option key={d.khoa} value={d.khoa}>
                      {d.khoa}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngành */}
              <div className="form-group">
                <label className="form-label">
                  <BookOpen size={15} /> Ngành học
                </label>
                <select
                  className="input"
                  value={selectedNganh}
                  onChange={(e) => setSelectedNganh(e.target.value)}
                  disabled={!selectedKhoa}
                  style={{
                    cursor: selectedKhoa ? "pointer" : "not-allowed",
                    opacity: selectedKhoa ? 1 : 0.6,
                  }}
                >
                  <option value="">-- Chọn ngành --</option>
                  {availableNganh.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">
                  <Lock size={15} /> Mật khẩu
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    className="input"
                    placeholder="Tối thiểu 6 ký tự"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? "An mat khau" : "Hien mat khau"}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label">
                  <Lock size={15} /> Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Nhập lại mật khẩu"
                  value={regPassword2}
                  onChange={(e) => setRegPassword2(e.target.value)}
                  style={{
                    borderColor:
                      regPassword2 && regPassword !== regPassword2
                        ? "var(--red)"
                        : undefined,
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-blue btn-lg"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={loading}
              >
                {loading ? (
                  "Đang đăng ký..."
                ) : (
                  <>
                    Tạo tài khoản <ChevronRight size={16} />
                  </>
                )}
              </button>

              <p
                style={{
                  textAlign: "center",
                  marginTop: "16px",
                  fontSize: "0.875rem",
                  color: "var(--muted)",
                }}
              >
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--blue)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Đăng nhập
                </button>
              </p>

              {/* Lưu ý bảo mật */}
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 14px",
                  background: "var(--amber-bg)",
                  borderRadius: "var(--r-md)",
                  borderLeft: "3px solid var(--amber)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--amber)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Tại sao cần MSV?
                </p>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--prose)",
                    lineHeight: 1.6,
                  }}
                >
                  MSV xác nhận bạn là sinh viên UED thật sự. Mỗi MSV chỉ được
                  đăng ký một lần, tránh tài khoản ảo và bảo vệ cộng đồng.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
