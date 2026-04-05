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

  let bg, color, label;
  if (days === 0) {
    bg = "var(--blue-bg)";
    color = "var(--blue)";
    label = "Hôm nay";
  } else if (days <= 3) {
    bg = "var(--blue-bg)";
    color = "var(--blue)";
    label = `${days} ngày trước`;
  } else if (days <= 7) {
    bg = "var(--amber-bg)";
    color = "var(--amber)";
    label = `${days} ngày trước`;
  } else {
    bg = "var(--red-bg)";
    color = "var(--red)";
    label = `${days} ngày trước`;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        borderRadius: "4px",
        background: bg,
        color: color,
        fontSize: "0.78rem",
        fontWeight: 700,
      }}
    >
      <Clock size={11} style={{ flexShrink: 0 }} /> {label}
    </span>
  );
};

const ItemCard = ({ item }) => {
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
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              display: "flex",
              gap: "6px",
            }}
          >
            {isUrgent && (
              <span
                style={{
                  background: "var(--red)",
                  color: "white",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Khẩn cấp!
              </span>
            )}
            {isFound && !isUrgent && (
              <span
                style={{
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  backdropFilter: "blur(4px)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#4ADE80",
                    marginRight: "4px",
                    verticalAlign: "middle",
                    animation: "livePulse 1.8s infinite",
                  }}
                ></span>
                Đang tìm
              </span>
            )}
            {isReturned && (
              <span
                style={{
                  background: "rgba(22,163,74,0.85)",
                  color: "white",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                }}
              >
                ✓ Đã trả
              </span>
            )}
          </div>
        </div>

        {/* Nội dung */}
        <div className="item-card-body">
          {/* Category + Time */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <span className="category-badge">
              <Tag size={11} /> {normalizeCategory(item.category)}
            </span>
            <TimeChip
              dateStr={item.date_lost_found}
              createdAt={item.created_at}
            />
          </div>

          {/* Title */}
          <h3 className="item-card-title">{item.title}</h3>

          {/* Description */}
          {item.description && (
            <p className="item-card-desc">{item.description}</p>
          )}

          {/* Meta */}
          <div className="item-card-meta">
            <MapPin size={13} style={{ color: "var(--red)", flexShrink: 0 }} />
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: "0.8125rem",
              }}
            >
              {item.location}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
