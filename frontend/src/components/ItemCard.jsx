import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Image as ImageIcon, Tag, Clock } from "lucide-react";

const normalizeCategory = (value) => {
  const raw = (value || "").toString().trim();
  if (!raw) return "Khác";

  const lower = raw.toLowerCase();
  if (lower === "khac" || /^kh.c$/i.test(raw)) {
    return "Khác";
  }

  return raw;
};

const parseDateValue = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Tính số ngày đã trôi qua
const getDaysAgo = (dateStr) => {
  const d = parseDateValue(dateStr);
  if (!d) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((todayStart - dateStart) / (1000 * 60 * 60 * 24));

  // Nếu lệch timezone hoặc dữ liệu sai nhẹ thì coi là hôm nay.
  return Math.max(0, diff);
};

// Chip thời gian — đổi màu theo độ tuổi
const TimeChip = ({ dateStr, createdAt }) => {
  const raw = dateStr || createdAt;
  const days = getDaysAgo(raw);
  if (days === null) return null;

  let tone = "cool";
  let label;
  if (days === 0) {
    tone = "cool";
    label = "Hôm nay";
  } else if (days <= 3) {
    tone = "cool";
    label = `${days} ngày trước`;
  } else if (days <= 7) {
    tone = "warm";
    label = `${days} ngày trước`;
  } else {
    tone = "hot";
    label = `${days} ngày trước`;
  }

  return (
    <span className={`item-chip item-chip-time tone-${tone}`}>
      <Clock size={11} style={{ flexShrink: 0 }} /> {label}
    </span>
  );
};

const ItemCard = ({ item }) => {
  const isLostPost = item.post_type === "LOST";
  const ownerLabel = isLostPost ? "Người mất" : "Người nhặt";
  const ownerName =
    item.posted_by?.full_name || item.posted_by?.username || "Chưa rõ";
  const ownerProfile = [item.posted_by?.khoa, item.posted_by?.nganh]
    .filter(Boolean)
    .join(" · ");
  const isFound = item.status === "FOUND";
  const isReturned = item.status === "RETURNED";
  const days = getDaysAgo(item.date_lost_found || item.created_at);
  const isUrgent = isFound && days !== null && days > 7;

  return (
    <Link
      to={`/item/${item.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div className="item-card">
        {/* Ảnh */}
        <div className="item-card-img">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #F1F5F9, #E2E8F0)",
                color: "var(--muted)",
              }}
            >
              <ImageIcon size={40} opacity={0.3} />
            </div>
          )}

          {/* Status badge góc ảnh */}
          <div className="item-card-status-stack">
            {isUrgent && (
              <span className="status-pill status-pill-urgent">Khẩn cấp</span>
            )}
            {isFound && !isUrgent && (
              <span className="status-pill status-pill-live">
                <span className="status-pill-live-dot"></span>
                {isLostPost ? "Đang tìm giúp" : "Chờ nhận lại"}
              </span>
            )}
            {isReturned && (
              <span className="status-pill status-pill-returned">Đã trả</span>
            )}
          </div>
        </div>

        {/* Nội dung */}
        <div className="item-card-body">
          {/* Category + Time */}
          <div className="item-card-tag-row">
            <div className="item-card-tag-cluster">
              <span className="category-badge">
                <Tag size={11} /> {normalizeCategory(item.category)}
              </span>
              <span
                className={`item-chip item-chip-post ${
                  isLostPost ? "lost" : "found"
                }`}
              >
                {isLostPost ? "Bài tìm đồ" : "Bài nhặt đồ"}
              </span>
            </div>
            <TimeChip
              dateStr={item.date_lost_found}
              createdAt={item.created_at}
            />
          </div>

          {/* Title */}
          <h3 className="item-card-title" title={item.title}>
            {item.title}
          </h3>

          {/* Description (rút gọn ở card chính) */}
          {item.description ? (
            <p className="item-card-desc" title={item.description}>
              {item.description}
            </p>
          ) : null}

          {/* Meta */}
          <div className="item-card-meta">
            <MapPin size={13} style={{ color: "var(--red)", flexShrink: 0 }} />
            <span className="item-card-location" title={item.location}>
              {item.location}
            </span>
          </div>

          <div
            className="item-card-owner"
            title={`${ownerLabel}: ${ownerName}${ownerProfile ? ` · ${ownerProfile}` : ""}`}
          >
            <strong style={{ color: "var(--ink)" }}>{ownerLabel}:</strong>{" "}
            {ownerName}
            {ownerProfile ? ` · ${ownerProfile}` : ""}
          </div>

          <div className="item-card-hover-panel" aria-hidden="true">
            <div className="item-card-hover-title">{item.title}</div>
            {item.description ? (
              <div className="item-card-hover-desc">{item.description}</div>
            ) : null}
            <div className="item-card-hover-line">
              <MapPin size={13} /> {item.location}
            </div>
            <div className="item-card-hover-line">
              <strong>{ownerLabel}:</strong> {ownerName}
              {ownerProfile ? ` · ${ownerProfile}` : ""}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
