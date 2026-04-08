import React, { useState, useContext, useEffect } from "react";
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
  Phone,
} from "lucide-react";
import getApiErrorMessage from "../utils/get-api-error-message";

const CATEGORIES = [
  "Ví/Giấy tờ",
  "Đồ Điện Tử",
  "Chìa Khoá",
  "Căn cước/Thẻ",
  "Khác",
];

const POST_TYPES = [
  {
    value: "FOUND",
    label: "Tôi nhặt được đồ",
    title: "Đăng tin đồ nhặt được",
    helper: "Ghi rõ đặc điểm, vị trí và thời điểm để người báo mất dễ nhận ra.",
  },
  {
    value: "LOST",
    label: "Tôi đang tìm đồ bị mất",
    title: "Đăng tin đồ thất lạc",
    helper:
      "Mô tả ngắn gọn và chính xác để người nhặt dễ đối chiếu và liên hệ.",
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PHONE_RE = /(?:\+84|0)(?:3|5|7|8|9)\d{8}\b/;
const URL_RE = /^https?:\/\//i;
const ITEM_IMAGE_MAX_COUNT = 5;

const CreateItem = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    post_type: "FOUND",
    category: "Khác",
    custody_type: "FINDER",
    description: "",
    brand: "",
    color: "",
    distinctive_features: "",
    contact_info: "",
    location: "",
    lost_at: "",
    found_at: "",
    image_url: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviewUrls]);

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

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      setImageFiles([]);
      setImagePreviewUrls([]);
      return;
    }

    if (files.length > ITEM_IMAGE_MAX_COUNT) {
      setError(`Chỉ được chọn tối đa ${ITEM_IMAGE_MAX_COUNT} ảnh.`);
      e.target.value = "";
      return;
    }

    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    for (const file of files) {
      if (!allowed.includes(file.type)) {
        setError("Chỉ hỗ trợ file ảnh PNG hoặc JPG/JPEG.");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Mỗi ảnh tối đa 5MB. Vui lòng chọn ảnh nhỏ hơn.");
        e.target.value = "";
        return;
      }
    }

    setError("");
    imagePreviewUrls.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });

    const previews = files.map((file) => URL.createObjectURL(file));
    setImageFiles(files);
    setImagePreviewUrls(previews);
    setFormData((prev) => ({ ...prev, image_url: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const selectedDate =
      formData.post_type === "LOST" ? formData.lost_at : formData.found_at;

    if (!formData.title || !formData.location || !selectedDate) {
      setError("Vui lòng điền đủ Tên vật phẩm, Vị trí và Thời điểm.");
      return;
    }

    if ((formData.description || "").trim().length < 20) {
      setError("Mô tả chi tiết cần ít nhất 20 ký tự.");
      return;
    }

    if ((formData.distinctive_features || "").trim().length < 10) {
      setError("Đặc điểm nhận dạng cần ít nhất 10 ký tự.");
      return;
    }

    if ((formData.contact_info || "").trim().length < 8) {
      setError("Thông tin liên hệ cần ít nhất 8 ký tự.");
      return;
    }

    const normalizedContact = (formData.contact_info || "").trim();
    const normalizedPhone = normalizedContact.replace(/[\s.-]/g, "");
    if (
      !(
        EMAIL_RE.test(normalizedContact) ||
        PHONE_RE.test(normalizedPhone) ||
        URL_RE.test(normalizedContact) ||
        /^@[a-zA-Z0-9_.]{3,}$/.test(normalizedContact)
      )
    ) {
      setError(
        "Liên hệ phải là email, số điện thoại, URL hoặc @username hợp lệ.",
      );
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("post_type", formData.post_type);
      payload.append("category", formData.category);
      payload.append("custody_type", formData.custody_type);
      payload.append("description", formData.description);
      payload.append("brand", formData.brand);
      payload.append("color", formData.color);
      payload.append("distinctive_features", formData.distinctive_features);
      payload.append("contact_info", formData.contact_info);
      payload.append("location", formData.location);
      payload.append("lost_at", formData.lost_at || "");
      payload.append("found_at", formData.found_at || "");
      payload.append("date_lost_found", selectedDate);
      if (formData.image_url) payload.append("image_url", formData.image_url);
      imageFiles.forEach((file) => payload.append("images", file));

      await axiosClient.post("/items", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const message =
        "Đăng bài thành công! Bài viết đã hiển thị ngay trên trang chủ.";
      setSuccessMessage(message);
      setTimeout(() => {
        navigate("/", {
          state: {
            successMessage: message,
          },
        });
      }, 400);
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
          {formData.post_type === "FOUND"
            ? "Đăng tin đồ nhặt được"
            : "Đăng tin đồ thất lạc"}
        </h1>
        <p className="page-subtitle">
          {POST_TYPES.find((p) => p.value === formData.post_type)?.helper}
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

          {successMessage && (
            <div
              style={{
                backgroundColor: "rgba(28,163,74,0.12)",
                color: "var(--green)",
                padding: "1rem",
                borderRadius: "var(--r-md)",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
                border: "1px solid rgba(28,163,74,0.3)",
              }}
            >
              <AlertCircle size={18} /> {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Target size={16} color="var(--blue)" /> Loại bài đăng
              </label>
              <select
                name="post_type"
                className="input"
                value={formData.post_type}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    post_type: nextType,
                    custody_type:
                      nextType === "LOST" ? "FINDER" : prev.custody_type,
                  }));
                }}
                style={{ cursor: "pointer", appearance: "menulist" }}
              >
                {POST_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Target size={16} color="var(--red)" />
                {formData.post_type === "FOUND"
                  ? "Tên đồ nhặt được"
                  : "Tên đồ bị mất"}{" "}
                <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                className="input-field"
                placeholder={
                  formData.post_type === "FOUND"
                    ? "vd: Ví da đen, chìa khóa xe AirBlade..."
                    : "vd: Ví da đen, AirPods, thẻ sinh viên..."
                }
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="ui-grid-2 create-item-grid">
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
                  <Calendar size={16} color="var(--blue)" />
                  {formData.post_type === "FOUND"
                    ? "Thời điểm nhặt được"
                    : "Thời điểm bị mất"}{" "}
                  <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  name={formData.post_type === "FOUND" ? "found_at" : "lost_at"}
                  className="input-field"
                  value={
                    formData.post_type === "FOUND"
                      ? formData.found_at
                      : formData.lost_at
                  }
                  onChange={handleChange}
                />
              </div>
            </div>

            {formData.post_type === "FOUND" && (
              <div className="form-group">
                <label
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Tag size={16} color="var(--amber)" /> Nơi đang giữ đồ
                </label>
                <select
                  name="custody_type"
                  className="input"
                  value={formData.custody_type}
                  onChange={handleChange}
                  style={{ cursor: "pointer", appearance: "menulist" }}
                >
                  <option value="FINDER">Tôi đang giữ đồ</option>
                  <option value="ADMIN">Tôi đã nộp cho khoa/admin</option>
                </select>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                    marginTop: "6px",
                  }}
                >
                  {formData.custody_type === "FINDER"
                    ? "Người báo mất sẽ liên hệ trực tiếp với bạn."
                    : "Người báo mất sẽ trao đổi với đầu mối đang giữ đồ."}
                </div>
              </div>
            )}

            <div className="form-group">
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <MapPin size={16} color="var(--red)" />
                {formData.post_type === "FOUND"
                  ? "Vị trí nhặt được"
                  : "Nơi để mất/nhìn thấy lần cuối"}{" "}
                <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="location"
                className="input-field"
                placeholder="Mô tả khu vực cụ thể: tòa nhà, tầng, khu vực gần..."
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="ui-grid-2 create-item-grid">
              <div className="form-group">
                <label
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Tag size={16} color="var(--blue)" /> Nhãn hiệu / hãng
                </label>
                <input
                  type="text"
                  name="brand"
                  className="input-field"
                  placeholder="vd: Apple, Yamaha, Casio..."
                  value={formData.brand}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Tag size={16} color="var(--blue)" /> Màu sắc chính
                </label>
                <input
                  type="text"
                  name="color"
                  className="input-field"
                  placeholder="vd: Đen, Trắng, Xanh navy..."
                  value={formData.color}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <AlignLeft size={16} color="var(--muted)" /> Mô tả chi tiết
                <span style={{ color: "red" }}>*</span>
              </label>
              <textarea
                name="description"
                className="input-field"
                placeholder={
                  formData.post_type === "FOUND"
                    ? "Mô tả bối cảnh nhặt được, tình trạng đồ và vật dụng đi kèm..."
                    : "Mô tả lúc để mất: hoàn cảnh, thời điểm, chi tiết giúp nhận diện..."
                }
                rows="4"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="form-group">
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Tag size={16} color="var(--amber)" /> Đặc điểm nhận dạng nổi
                bật <span style={{ color: "red" }}>*</span>
              </label>
              <textarea
                name="distinctive_features"
                className="input-field"
                placeholder="vd: trầy góc phải, có dán sticker hình mèo, trong ví có thẻ ATM màu xanh..."
                rows="3"
                value={formData.distinctive_features}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="form-group" style={{ marginBottom: "1.2rem" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Phone size={16} color="var(--blue)" /> Cách liên hệ
                <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="contact_info"
                className="input-field"
                placeholder="SĐT, Zalo, email hoặc Facebook để liên hệ"
                value={formData.contact_info}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Camera size={16} color="var(--muted)" /> Ảnh đính kèm (PNG/JPG,
                tối đa {ITEM_IMAGE_MAX_COUNT} ảnh, mỗi ảnh 5MB)
              </label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                className="input-field"
                multiple
                onChange={handleImageFileChange}
              />
              {imageFiles.length > 0 ? (
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                  }}
                >
                  Đã chọn {imageFiles.length} ảnh.
                </div>
              ) : null}
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Camera size={16} color="var(--muted)" /> Hoặc dán Link ảnh (Tùy
                chọn)
              </label>
              <input
                type="url"
                name="image_url"
                className="input-field"
                placeholder="Nhập đường link hình ảnh (nếu có)"
                value={formData.image_url}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value.trim()) {
                    setImageFiles([]);
                    imagePreviewUrls.forEach((url) => {
                      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
                    });
                    setImagePreviewUrls([]);
                  }
                }}
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
                {loading
                  ? "Đang gửi thông tin..."
                  : formData.post_type === "FOUND"
                    ? "ĐĂNG TIN ĐỒ NHẶT ĐƯỢC"
                    : "ĐĂNG TIN ĐỒ THẤT LẠC"}
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
              <AlertCircle size={20} /> Mẹo đăng tin hiệu quả
            </h4>
            <ul className="ui-list" style={{ color: "rgba(255,255,255,0.88)" }}>
              <li>
                Mô tả rõ <strong>khu vực + mốc thời gian</strong> để người xem
                đối chiếu nhanh.
              </li>
              <li>
                Luôn ghi ít nhất 1-2{" "}
                <strong>đặc điểm nhận dạng độc nhất</strong>, nhưng tránh công
                khai toàn bộ thông tin bí mật.
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
              style={{
                padding:
                  imagePreviewUrls.length > 0 || formData.image_url
                    ? "0"
                    : "2rem",
              }}
            >
              {imagePreviewUrls.length > 0 || formData.image_url ? (
                <img
                  src={imagePreviewUrls[0] || formData.image_url}
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
            {imagePreviewUrls.length > 1 ? (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                }}
              >
                +{imagePreviewUrls.length - 1} ảnh khác sẽ được tải lên.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateItem;
