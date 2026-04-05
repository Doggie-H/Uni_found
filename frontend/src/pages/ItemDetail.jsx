import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axios-client";
import { AuthContext } from "../context/AuthContext";
import {
  MapPin,
  Calendar,
  Image as ImageIcon,
  ArrowLeft,
  Tag,
  Clock,
} from "lucide-react";
import getApiErrorMessage from "../utils/get-api-error-message";

const normalizeCategory = (value) => {
  const raw = (value || "").toString().trim();
  if (!raw) return "Khác";

  const lower = raw.toLowerCase();
  if (lower === "khac" || /^kh.c$/i.test(raw)) {
    return "Khác";
  }

  return raw;
};

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimDesc, setClaimDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        const res = await axiosClient.get(`/items/${id}`);
        setItem(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetail();
  }, [id]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimDesc || claimDesc.trim().length < 10) {
      alert(
        "Vui lòng nhập mô tả chứng minh món đồ này là của bạn (ít nhất 10 ký tự).",
      );
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.post("/claims", {
        item_id: item.id,
        description: claimDesc.trim(),
      });
      alert("Yêu cầu nhận đồ đã được gửi thành công!");
      setShowClaimForm(false);
      setClaimDesc("");
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, "Lỗi khi gửi yêu cầu."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="container page-shell" style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid var(--border)",
            borderTopColor: "var(--red)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto",
          }}
        ></div>
      </div>
    );
  if (!item)
    return (
      <div
        className="container page-shell"
        style={{ textAlign: "center", fontSize: "1.1rem" }}
      >
        Không tìm thấy đồ vật này!
      </div>
    );

  const isFound = item.status === "FOUND";
  const isOwner = !!user && item.user_id === user.id;

  return (
    <div className="container page-shell" style={{ paddingTop: "2rem" }}>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost"
        style={{ marginBottom: "1.2rem" }}
      >
        <ArrowLeft size={18} /> Quay lại
      </button>

      <div className="detail-layout">
        <div className="detail-image-wrap">
          {item.image_url ? (
            <div style={{ width: "100%", height: "100%" }}>
              <img src={item.image_url} alt={item.title} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
                }}
              ></div>
            </div>
          ) : (
            <div
              style={{
                color: "var(--muted)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <ImageIcon size={64} opacity={0.3} />
              <span
                style={{
                  marginTop: "12px",
                  fontSize: "1.125rem",
                  fontWeight: 500,
                }}
              >
                Không có ảnh đính kèm
              </span>
            </div>
          )}

          {/* Floating Status */}
          <div style={{ position: "absolute", top: "1rem", left: "1rem" }}>
            <span
              className={`status-badge ${isFound ? "found" : "returned"}`}
              style={{
                fontSize: "0.875rem",
                padding: "0.5rem 1rem",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              {isFound && <span className="status-dot"></span>}
              {isFound ? "ĐANG THẤT LẠC" : "ĐÃ ĐƯỢC TRẢ"}
            </span>
          </div>
        </div>

        <div
          style={{
            padding: "0.5rem 0.25rem 0.5rem 0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--blue)",
              backgroundColor: "var(--blue-bg)",
              padding: "6px 12px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.875rem",
              marginBottom: "1rem",
              width: "fit-content",
            }}
          >
            <Tag size={16} /> {normalizeCategory(item.category)}
          </div>

          <h2
            style={{
              fontSize: "clamp(1.8rem, 3.6vw, 2.4rem)",
              lineHeight: "1.2",
              marginBottom: "1rem",
              letterSpacing: "-1px",
              fontFamily: "var(--font-head)",
              color: "var(--ink)",
            }}
          >
            {item.title}
          </h2>

          <div
            style={{
              width: "60px",
              height: "4px",
              backgroundColor: "var(--red)",
              marginBottom: "1.5rem",
              borderRadius: "2px",
            }}
          ></div>

          <div
            style={{
              fontSize: "1.03rem",
              color: "var(--prose)",
              marginBottom: "2rem",
              whiteSpace: "pre-line",
              lineHeight: 1.7,
            }}
          >
            {item.description ||
              "Chưa có mô tả chi tiết. Vui lòng dựa vào ảnh và vị trí để nhận diện."}
          </div>

          <div className="detail-info-grid">
            <div className="detail-info-item">
              <div className="icon">
                <MapPin size={24} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "var(--muted)",
                    marginBottom: "4px",
                  }}
                >
                  Vị trí tìm thấy
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {item.location}
                </div>
              </div>
            </div>

            <div className="detail-info-item">
              <div className="icon">
                <Calendar size={24} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "var(--muted)",
                    marginBottom: "4px",
                  }}
                >
                  Ngày xảy ra (Mất/Nhặt)
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {item.date_lost_found ||
                    new Date(item.created_at).toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            {isFound ? (
              !showClaimForm ? (
                <button
                  className="btn btn-danger btn-lg"
                  style={{ width: "100%" }}
                  onClick={() => {
                    if (!user) {
                      alert("Vui lòng đăng nhập để Claim món đồ này!");
                      navigate("/login");
                    } else if (isOwner) {
                      alert("Bạn không thể claim món đồ do chính mình đăng.");
                    } else {
                      setShowClaimForm(true);
                    }
                  }}
                >
                  ĐÂY CHÍNH LÀ ĐỒ GIÚP TÔI! 👋
                </button>
              ) : (
                <form
                  onSubmit={handleClaimSubmit}
                  className="detail-claim-box animate-reveal"
                  style={{
                    backgroundColor: "white",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1.3rem",
                      color: "var(--ink)",
                      marginBottom: "0.5rem",
                      letterSpacing: "-0.02em",
                      fontWeight: 800,
                    }}
                  >
                    XÁC NHẬN SỞ HỮU
                  </h4>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--muted)",
                      marginBottom: "1.2rem",
                      fontWeight: 500,
                    }}
                  >
                    Hãy miêu tả chi tiết (mật khẩu điện thoại, hình nền, thẻ
                    trong ví...) để Admin kiểm chứng.
                  </p>
                  <textarea
                    className="input-field"
                    rows="4"
                    placeholder="Ví dụ: Hình nền điện thoại là ảnh con chó màu trắng, ốp lưng màu đen xước góc..."
                    value={claimDesc}
                    onChange={(e) => setClaimDesc(e.target.value)}
                    style={{ marginBottom: "1.5rem" }}
                  ></textarea>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setShowClaimForm(false)}
                      style={{ flex: "1" }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: "2", padding: "1.2rem" }}
                      disabled={submitting}
                    >
                      {submitting ? "ĐANG GỬI..." : "GỬI YÊU CẦU DUYỆT"}
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  padding: "1.5rem",
                  backgroundColor: "var(--green-bg)",
                  color: "var(--green)",
                  borderRadius: "16px",
                  textAlign: "center",
                  border: "1px solid rgba(22,163,74,0.32)",
                }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "10px",
                    borderRadius: "50%",
                    color: "var(--green)",
                  }}
                >
                  <Clock size={28} />
                </div>
                <div>
                  <h4
                    style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}
                  >
                    ĐÃ TRẢ VỀ CHỦ NHÂN
                  </h4>
                  <span
                    style={{
                      fontSize: "0.9rem",
                      opacity: 0.9,
                      fontWeight: 500,
                    }}
                  >
                    Món đồ này đã hoàn thành sứ mệnh.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
