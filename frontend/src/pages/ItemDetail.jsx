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
import { getItemImageUrls, getPrimaryItemImage } from "../utils/item-images";

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeImageError, setActiveImageError] = useState(false);
  const [actionNotice, setActionNotice] = useState("");

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

  useEffect(() => {
    setActiveImageIndex(0);
    setActiveImageError(false);
  }, [item]);

  useEffect(() => {
    setActiveImageError(false);
  }, [activeImageIndex]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimDesc || !claimDesc.trim()) {
      alert(
        item?.post_type === "LOST"
          ? "Vui lòng mô tả cách bạn đã nhặt được món đồ này."
          : "Vui lòng mô tả chi tiết để xác minh đây là đồ của bạn.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await axiosClient.post("/claims", {
        item_id: item.id,
        description: claimDesc.trim(),
      });
      alert(res.data?.message || "Yêu cầu đã được ghi nhận.");
      setActionNotice(
        item?.post_type === "LOST"
          ? "Đã gửi thông báo: có người nhặt được vật phẩm bạn đang tìm."
          : "Đã gửi yêu cầu nhận lại vật phẩm kèm bằng chứng.",
      );
      setShowClaimForm(false);
      setClaimDesc("");
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, "Không thể gửi yêu cầu."));
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
        Không tìm thấy bài đăng này!
      </div>
    );

  const isFound = item.status === "FOUND";
  const isLostPost = item.post_type === "LOST";
  const isOwner = !!user && item.user_id === user.id;
  const ownerLabel = isLostPost ? "Người báo mất" : "Người nhặt được";
  const ownerName =
    item.posted_by?.full_name || item.posted_by?.username || "Chưa rõ";
  const ownerProfile = [item.posted_by?.khoa, item.posted_by?.nganh]
    .filter(Boolean)
    .join(" · ");
  const eventDateValue = isLostPost
    ? item.lost_at || item.date_lost_found
    : item.found_at || item.date_lost_found;
  const itemImageUrls = getItemImageUrls(item);
  const activeImageUrl =
    itemImageUrls[activeImageIndex] || getPrimaryItemImage(item);
  const showActiveImage = activeImageUrl && !activeImageError;

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
          {showActiveImage ? (
            <div
              style={{ width: "100%", height: "100%", position: "relative" }}
            >
              <img
                src={activeImageUrl}
                alt={item.title}
                onError={() => setActiveImageError(true)}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
                }}
              ></div>
              {itemImageUrls.length > 1 ? (
                <div
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    zIndex: 2,
                  }}
                >
                  <span
                    className="status-pill status-pill-live"
                    style={{
                      background: "rgba(15, 23, 42, 0.82)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    Ảnh {activeImageIndex + 1}/{itemImageUrls.length}
                  </span>
                </div>
              ) : null}
              {itemImageUrls.length > 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: "1rem",
                    right: "1rem",
                    bottom: "1rem",
                    zIndex: 2,
                    display: "flex",
                    gap: "8px",
                    overflowX: "auto",
                    paddingBottom: "2px",
                  }}
                >
                  {itemImageUrls.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`Xem ảnh ${index + 1}`}
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border:
                          index === activeImageIndex
                            ? "2px solid #fff"
                            : "2px solid rgba(255,255,255,0.35)",
                        padding: 0,
                        flexShrink: 0,
                        background: "rgba(15, 23, 42, 0.35)",
                        boxShadow:
                          index === activeImageIndex
                            ? "0 8px 20px rgba(0,0,0,0.35)"
                            : "none",
                      }}
                    >
                      <img
                        src={url}
                        alt={`${item.title} - ảnh ${index + 1}`}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </button>
                  ))}
                </div>
              ) : null}
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
              {isFound
                ? isLostPost
                  ? "ĐANG TÌM ĐỒ"
                  : "ĐANG CHỜ NHẬN LẠI"
                : "ĐÃ HOÀN TẤT"}
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

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 10px",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "0.78rem",
              color: isLostPost ? "var(--amber)" : "var(--blue)",
              background: isLostPost ? "var(--amber-bg)" : "var(--blue-bg)",
              width: "fit-content",
              marginBottom: "1rem",
            }}
          >
            {isLostPost ? "Bài đăng đồ thất lạc" : "Bài đăng đồ nhặt được"}
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
            <div
              style={{
                marginTop: "12px",
                fontSize: "0.9rem",
                color: "var(--muted)",
                fontWeight: 500,
              }}
            >
              {isLostPost
                ? "Đây là bài đăng của người báo mất đồ. Nếu bạn đã nhặt được, hãy gửi yêu cầu để đối chiếu."
                : item.custody_type === "ADMIN"
                  ? "Món đồ đang được gửi tại khoa/admin: người báo mất có thể mở yêu cầu để xác minh và hẹn nhận."
                  : "Món đồ đang do người nhặt giữ: người báo mất sẽ liên hệ trực tiếp với người nhặt."}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
              marginBottom: "1.5rem",
              padding: "12px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  marginBottom: "4px",
                }}
              >
                {ownerLabel}
              </div>
              <div style={{ color: "var(--ink)", fontWeight: 500 }}>
                {ownerName}
              </div>
              {ownerProfile ? (
                <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {ownerProfile}
                </div>
              ) : null}
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  marginBottom: "4px",
                }}
              >
                Nhãn hiệu
              </div>
              <div style={{ color: "var(--ink)", fontWeight: 500 }}>
                {item.brand || "-"}
              </div>
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  marginBottom: "4px",
                }}
              >
                Màu sắc
              </div>
              <div style={{ color: "var(--ink)", fontWeight: 500 }}>
                {item.color || "-"}
              </div>
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  marginBottom: "4px",
                }}
              >
                Liên hệ
              </div>
              <div style={{ color: "var(--ink)", fontWeight: 500 }}>
                {item.contact_info || "-"}
              </div>
            </div>
          </div>

          {Array.isArray(item.category_checklist) &&
          item.category_checklist.length ? (
            <div
              style={{
                marginBottom: "1rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "10px 12px",
              }}
            >
              <strong style={{ color: "var(--ink)" }}>
                Checklist xác minh:
              </strong>
              <ul
                style={{
                  margin: "8px 0 0",
                  paddingLeft: "18px",
                  color: "var(--prose)",
                }}
              >
                {item.category_checklist.map((it, idx) => (
                  <li key={`${idx}-${it}`}>{it}</li>
                ))}
              </ul>
            </div>
          ) : null}

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
                  {isLostPost ? "Nơi để mất" : "Vị trí nhặt được"}
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
                  {isLostPost ? "Thời điểm để mất" : "Thời điểm nhặt được"}
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {eventDateValue ||
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
                      setActionNotice(
                        isLostPost
                          ? "Bạn sắp gửi thông báo có người nhặt được vật phẩm đang tìm."
                          : "Bạn sắp gửi yêu cầu nhận lại vật phẩm kèm bằng chứng.",
                      );
                      setShowClaimForm(true);
                    }
                  }}
                >
                  {isLostPost
                    ? "TÔI LÀ NGƯỜI NHẶT ĐƯỢC"
                    : "TÔI LÀ NGƯỜI BỊ MẤT"}
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
                    {isLostPost
                      ? "Hãy mô tả bằng chứng bạn đã nhặt được món đồ này (địa điểm, thời điểm, tình trạng...) để người báo mất xác minh."
                      : item.custody_type === "ADMIN"
                        ? "Hãy miêu tả chi tiết để bên giữ vật phẩm kiểm chứng khi trao đổi."
                        : "Hãy miêu tả chi tiết để người nhặt đối chiếu khi trao đổi."}
                  </p>
                  {actionNotice ? (
                    <div
                      style={{
                        marginBottom: "1rem",
                        background: "var(--blue-bg)",
                        color: "var(--blue)",
                        border: "1px solid rgba(59,130,246,0.3)",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        fontSize: "0.86rem",
                        fontWeight: 600,
                      }}
                    >
                      {actionNotice}
                    </div>
                  ) : null}
                  <textarea
                    className="input-field"
                    rows="4"
                    placeholder="Ví dụ: Hình nền điện thoại là ảnh con chó màu trắng, ốp lưng màu đen xước góc..."
                    value={claimDesc}
                    onChange={(e) => setClaimDesc(e.target.value)}
                    style={{ marginBottom: "1.5rem" }}
                  ></textarea>
                  <div className="ui-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setShowClaimForm(false);
                        setActionNotice("");
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? "ĐANG GỬI..." : "GỬI YÊU CẦU TRAO ĐỔI"}
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
