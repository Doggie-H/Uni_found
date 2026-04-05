import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axios-client";
import { AuthContext } from "../context/AuthContext";
import {
  Camera,
  MapPin,
  AlignLeft,
  Target,
  Calendar,
  Tag,
  AlertCircle,
} from "lucide-react";
import getApiErrorMessage from "../utils/get-api-error-message";

const CATEGORIES = [
  "Ví/Giấy tờ",
  "Đồ Điện Tử",
  "Chìa Khoá",
  "Căn cước/Thẻ",
  "Khác",
];

const CreateItem = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    category: "Khác",
    description: "",
    location: "",
    date_lost_found: "",
    image_url: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="container page-shell" style={{ textAlign: "center" }}>
        <div
          style={{
            backgroundColor: "var(--red)",
            color: "white",
            display: "inline-flex",
            padding: "20px",
            borderRadius: "50%",
            marginBottom: "1.5rem",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <AlertCircle size={40} />
        </div>
        <h2 className="page-title" style={{ marginBottom: "1rem" }}>
          Bạn đi lạc rồi!
        </h2>
        <p className="page-subtitle" style={{ margin: "0 auto 2rem" }}>
          Bạn cần đăng nhập để được quyền báo cáo hoặc xác nhận đồ vật.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="btn btn-danger btn-lg"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.location || !formData.date_lost_found) {
      setError("Vui lòng điền đủ Tiêu đề, Vị trí và Ngày xảy ra!");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post("/items", { ...formData });
      alert("Cập nhật tin thành công! Cảm ơn bạn vì hành động đẹp.");
      navigate("/");
    } catch (error) {
      console.error(error);
      setError(
        getApiErrorMessage(
          error,
          "Đã xảy ra lỗi khi đăng tin. Vui lòng thử lại.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-shell">
      <div className="page-hero">
        <div className="page-kicker">
          <Camera size={14} /> Biểu mẫu chuẩn UniFound
        </div>
        <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
          Cấp báo nhặt được đồ!
        </h1>
        <p className="page-subtitle">
          Điền thông tin chi tiết nhất có thể để chủ nhân sớm tìm lại được đồ
          nhé.
        </p>
      </div>

      <div className="ui-grid-2">
        <div className="ui-panel">
          {error && (
            <div
              style={{
                backgroundColor: "var(--red-bg)",
                color: "var(--red)",
                padding: "1rem",
                borderRadius: "var(--r-md)",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
                border: "1px solid rgba(232,57,42,0.25)",
              }}
            >
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Target size={16} color="var(--red)" /> Tiêu đề (Món đồ){" "}
                <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                className="input-field"
                placeholder="vd: Chìa khoá xe AirBlade, Thẻ Căn Cước..."
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div
              className="ui-grid-2"
              style={{ gap: "1rem", gridTemplateColumns: "1fr 1fr" }}
            >
              <div className="form-group">
                <label
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Tag size={16} color="var(--blue)" /> Phân loại phân mục
                </label>
                <select
                  name="category"
                  className="input"
                  value={formData.category}
                  onChange={handleChange}
                  style={{ cursor: "pointer", appearance: "menulist" }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Calendar size={16} color="var(--blue)" /> Ngày nhặt/Mất đồ{" "}
                  <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="date"
                  name="date_lost_found"
                  className="input-field"
                  value={formData.date_lost_found}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <MapPin size={16} color="var(--red)" /> Vị trí nhặt được{" "}
                <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="location"
                className="input-field"
                placeholder="Mô tả khu vực: Nhà để xe B1, Bếp ăn khu C..."
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <AlignLeft size={16} color="var(--muted)" /> Mô tả chi tiết (Tùy
                chọn)
              </label>
              <textarea
                name="description"
                className="input-field"
                placeholder="Bạn có thể mô tả sương sương, không nên kể quá chi tiết để tránh kẻ gian nhũng nhiễu..."
                rows="3"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Camera size={16} color="var(--muted)" /> Link Ảnh đính kèm (Tùy
                chọn)
              </label>
              <input
                type="url"
                name="image_url"
                className="input-field"
                placeholder="Nhập đường link hình ảnh (nếu có)"
                value={formData.image_url}
                onChange={handleChange}
              />
            </div>

            <div className="ui-actions">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="btn btn-ghost"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={loading}
                style={{ flex: 1.3 }}
              >
                {loading ? "Đang gửi thông tin..." : "ĐĂNG BÁO CÁO NHẶT ĐỒ"}
              </button>
            </div>
          </form>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
        >
          <div
            className="ui-panel"
            style={{
              backgroundColor: "var(--ink)",
              color: "white",
            }}
          >
            <h4
              style={{
                fontSize: "1.25rem",
                color: "#fff",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={20} /> Mẹo để chủ nhân dễ nhận diện
            </h4>
            <ul className="ui-list" style={{ color: "rgba(255,255,255,0.88)" }}>
              <li>
                Cố gắng nhớ chuẩn xác <strong>Khu vực</strong> lúc bạn thấy đồ.
              </li>
              <li>
                <strong>Tuyệt đối không khoe hết đặc điểm bí mật.</strong> Hãy
                che bớt một vài thông tin (vd: thẻ gì bên trong ví) để họ xác
                minh!
              </li>
              <li>
                Ảnh chụp tổng quan. Đừng cố zoom vào thông tin cá nhân của họ.
              </li>
            </ul>
          </div>

          <div
            className="ui-panel"
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h4
              style={{
                fontSize: "1.125rem",
                marginBottom: "1rem",
                color: "var(--ink)",
                fontWeight: 800,
              }}
            >
              LIVE PREVIEW
            </h4>
            <div
              className="ui-media"
              style={{ padding: formData.image_url ? "0" : "2rem" }}
            >
              {formData.image_url ? (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.innerHTML =
                      '<span style="color:var(--red); font-weight: 700">Link ảnh bị hỏng</span>';
                  }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "var(--muted)" }}>
                  <Camera
                    size={40}
                    style={{ margin: "0 auto 8px auto", opacity: 0.5 }}
                  />
                  <span style={{ fontWeight: 600 }}>Chưa có nguồn ảnh</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateItem;
