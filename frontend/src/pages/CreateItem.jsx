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
    label: "Tôi nhặt được vật phẩm",
    title: "Đăng tin Nhặt được đồ",
    helper:
      "Cung cấp thông tin đủ rõ để người mất nhận diện nhưng tránh lộ bí mật quan trọng.",
  },
  {
    value: "LOST",
    label: "Tôi đang tìm vật phẩm bị mất",
    title: "Đăng tin Tìm đồ thất lạc",
    helper:
      "Mô tả chính xác đặc điểm để người nhặt dễ đối chiếu và liên hệ nhanh.",
  },
];

const CATEGORY_CHECKLISTS = {
  "Ví/Giấy tờ": [
    "Chất liệu/kiểu ví hoặc giấy tờ",
    "Vật dụng bên trong nổi bật",
    "Điểm nhận dạng riêng (vết xước, màu chỉ, dấu dán)",
  ],
  "Đồ Điện Tử": [
    "Model/thiết bị cụ thể",
    "Phụ kiện đi kèm (sạc, ốp, tai nghe)",
    "Dấu hiệu nhận dạng (hình nền, sticker, vết trầy)",
  ],
  "Chìa Khoá": [
    "Loại chìa khóa (xe, phòng, tủ)",
    "Số lượng chìa và móc khóa",
    "Dấu hiệu nhận dạng đặc biệt",
  ],
  "Căn cước/Thẻ": [
    "Loại thẻ/giấy tờ",
    "Màu sắc và vỏ bọc",
    "Thông tin che mờ để xác minh khi trao đổi",
  ],
  Khác: [
    "Mô tả hình dáng tổng quan",
    "Dấu hiệu đặc trưng dễ nhận biết",
    "Thông tin đi kèm hoặc bối cảnh liên quan",
  ],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PHONE_RE = /(?:\+84|0)(?:3|5|7|8|9)\d{8}\b/;
const URL_RE = /^https?:\/\//i;

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
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [checklistAnswers, setChecklistAnswers] = useState(["", "", ""]);

  const checklistLabels =
    CATEGORY_CHECKLISTS[formData.category] || CATEGORY_CHECKLISTS.Khác;

  useEffect(() => {
    setChecklistAnswers((prev) => {
      const next = [...prev];
      while (next.length < checklistLabels.length) next.push("");
      return next.slice(0, checklistLabels.length);
    });
  }, [formData.category, checklistLabels.length]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

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
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreviewUrl("");
      return;
    }

    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setError("Chỉ hỗ trợ file ảnh PNG hoặc JPG/JPEG.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.");
      e.target.value = "";
      return;
    }

    setError("");
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewUrl(preview);
    setFormData((prev) => ({ ...prev, image_url: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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

    const normalizedChecklist = checklistAnswers
      .map((v) => (v || "").trim())
      .filter(Boolean);
    if (normalizedChecklist.length < 2) {
      setError(
        "Vui lòng điền ít nhất 2 mục checklist nhận dạng theo danh mục.",
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
      payload.append("category_checklist", JSON.stringify(normalizedChecklist));
      if (formData.image_url) payload.append("image_url", formData.image_url);
      if (imageFile) payload.append("image", imageFile);

      await axiosClient.post("/items", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
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
          {formData.post_type === "FOUND"
            ? "Đăng tin nhặt được đồ"
            : "Đăng tin tìm đồ thất lạc"}
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
                  ? "Tên vật phẩm nhặt được"
                  : "Tên vật phẩm đang tìm"}{" "}
                <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                className="input-field"
                placeholder={
                  formData.post_type === "FOUND"
                    ? "vd: Chìa khóa xe AirBlade, ví da đen..."
                    : "vd: Mất ví da màu đen, mất AirPods..."
                }
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
                  <Tag size={16} color="var(--amber)" /> Nơi lưu giữ vật phẩm
                </label>
                <select
                  name="custody_type"
                  className="input"
                  value={formData.custody_type}
                  onChange={handleChange}
                  style={{ cursor: "pointer", appearance: "menulist" }}
                >
                  <option value="FINDER">Tôi đang giữ vật phẩm</option>
                  <option value="ADMIN">
                    Tôi đã nộp vật phẩm cho khoa/admin
                  </option>
                </select>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                    marginTop: "6px",
                  }}
                >
                  {formData.custody_type === "FINDER"
                    ? "Người tìm sẽ nhắn tin trực tiếp với bạn."
                    : "Người tìm sẽ liên hệ admin để xin duyệt và trao đổi."}
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
                  : "Vị trí làm mất/nhìn thấy lần cuối"}{" "}
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

            <div
              className="ui-grid-2"
              style={{ gap: "1rem", gridTemplateColumns: "1fr 1fr" }}
            >
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
                    ? "Mô tả bối cảnh nhặt được, tình trạng vật phẩm, vật dụng đi kèm..."
                    : "Mô tả lúc bị mất: hoàn cảnh, thời điểm, chi tiết có thể chứng minh sở hữu..."
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

            <div className="form-group">
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Target size={16} color="var(--amber)" /> Checklist xác minh
                theo danh mục <span style={{ color: "red" }}>*</span>
              </label>
              <div
                style={{
                  display: "grid",
                  gap: "8px",
                  border: "1px dashed var(--border)",
                  borderRadius: "10px",
                  padding: "10px",
                }}
              >
                {checklistLabels.map((label, idx) => (
                  <div key={`${label}-${idx}`}>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--muted)",
                        marginBottom: "4px",
                        fontWeight: 600,
                      }}
                    >
                      {idx + 1}. {label}
                    </div>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Nhập thông tin nhận dạng tương ứng..."
                      value={checklistAnswers[idx] || ""}
                      onChange={(e) => {
                        const next = [...checklistAnswers];
                        next[idx] = e.target.value;
                        setChecklistAnswers(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.2rem" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Phone size={16} color="var(--blue)" /> Cách liên hệ nhanh
                <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="contact_info"
                className="input-field"
                placeholder="SĐT/Zalo/Email/Facebook để bên kia liên hệ"
                value={formData.contact_info}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Camera size={16} color="var(--muted)" /> Ảnh đính kèm (PNG/JPG,
                tối đa 5MB)
              </label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                className="input-field"
                onChange={handleImageFileChange}
              />
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
                    setImageFile(null);
                    if (
                      imagePreviewUrl &&
                      imagePreviewUrl.startsWith("blob:")
                    ) {
                      URL.revokeObjectURL(imagePreviewUrl);
                    }
                    setImagePreviewUrl("");
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
                    ? "ĐĂNG TIN NHẶT ĐƯỢC ĐỒ"
                    : "ĐĂNG TIN TÌM ĐỒ THẤT LẠC"}
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
                padding: imagePreviewUrl || formData.image_url ? "0" : "2rem",
              }}
            >
              {imagePreviewUrl || formData.image_url ? (
                <img
                  src={imagePreviewUrl || formData.image_url}
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
