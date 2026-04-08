import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axios-client";
import ItemCard from "../components/ItemCard";
import { AuthContext } from "../context/AuthContext";
import {
  Search,
  Wallet,
  Smartphone,
  Key,
  CreditCard,
  Box,
  Compass,
} from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import getApiErrorMessage from "../utils/get-api-error-message";

const CATEGORIES = [
  { name: "Tất cả", icon: Compass },
  { name: "Ví/Giấy tờ", icon: Wallet },
  { name: "Đồ Điện Tử", icon: Smartphone },
  { name: "Chìa Khoá", icon: Key },
  { name: "Căn cước/Thẻ", icon: CreditCard },
  { name: "Khác", icon: Box },
];

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "FOUND", label: "Chưa tìm được" },
  { value: "RETURNED", label: "Đã tìm được" },
];

const TIME_FILTERS = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày gần đây" },
  { value: "30d", label: "30 ngày gần đây" },
  { value: "90d", label: "90 ngày gần đây" },
];

const parseDateValue = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getItemAgeInDays = (item) => {
  const sourceDate = item?.date_lost_found || item?.created_at;
  const parsed = parseDateValue(sourceDate);
  if (!parsed) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );

  return Math.max(
    0,
    Math.floor((todayStart - dateStart) / (1000 * 60 * 60 * 24)),
  );
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");

  useEffect(() => {
    const message = location.state?.successMessage;
    if (!message) return;

    setSuccessNotice(message);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const fetchItems = useCallback(
    async (kw = keyword, cat = category) => {
      setLoading(true);
      try {
        const params = {};
        if (kw) params.keyword = kw;
        if (cat && cat !== "Tất cả") params.category = cat;
        const res = await axiosClient.get("/items", { params });
        setItems(res.data);
      } catch (e) {
        console.error(e);
        alert(getApiErrorMessage(e, "Không thể tải danh sách đồ vật."));
      } finally {
        setLoading(false);
      }
    },
    [keyword, category],
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchItems();
    const target = document.getElementById("item-list");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCategoryClick = (catName) => {
    const val = catName === "Tất cả" ? "" : catName;
    setCategory(val);
  };

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    const ageInDays = getItemAgeInDays(item);
    const matchesTime =
      timeFilter === "all" ||
      (timeFilter === "today" && ageInDays === 0) ||
      (timeFilter === "7d" && ageInDays !== null && ageInDays <= 7) ||
      (timeFilter === "30d" && ageInDays !== null && ageInDays <= 30) ||
      (timeFilter === "90d" && ageInDays !== null && ageInDays <= 90);

    return matchesStatus && matchesTime;
  });

  const pendingCount = filteredItems.filter(
    (item) => item.status === "FOUND",
  ).length;
  const returnedCount = filteredItems.filter(
    (item) => item.status === "RETURNED",
  ).length;
  const openFoundPosts = filteredItems.filter(
    (item) => item.status === "FOUND" && item.post_type === "FOUND",
  ).length;
  const openLostPosts = filteredItems.filter(
    (item) => item.status === "FOUND" && item.post_type === "LOST",
  ).length;

  return (
    <div>
      {/* =============================================
                HERO — Left-aligned, không blob, không symmetric
                ============================================= */}
      <div
        className="hero-v2"
        style={{
          backgroundColor: "var(--white)",
          borderBottom: "1px solid var(--border)",
          padding: "var(--s8) 0 0 0",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "1160px",
            margin: "0 auto",
            padding: "0 var(--s5)",
          }}
        >
          <div
            className="hero-grid-v2"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--s8)",
              alignItems: "center",
            }}
          >
            {/* Cột trái — Copy */}
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--blue)",
                  background: "var(--blue-bg)",
                  padding: "5px 12px",
                  borderRadius: "4px",
                  marginBottom: "var(--s4)",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "currentColor",
                    animation: "livePulse 2s infinite",
                    flexShrink: 0,
                  }}
                ></span>
                {pendingCount > 0
                  ? `${pendingCount} bài đăng đang mở`
                  : "Cộng đồng tìm đồ thất lạc"}
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-head)",
                  fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                  fontWeight: 700,
                  color: "var(--ink)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  marginBottom: "var(--s4)",
                }}
              >
                Bị mất đồ?
                <br />
                <span style={{ color: "var(--red)" }}>Cộng đồng</span> sẽ
                <br />
                giúp bạn.
              </h1>

              <p
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--muted)",
                  lineHeight: 1.7,
                  marginBottom: "var(--s6)",
                  maxWidth: "380px",
                }}
              >
                Đăng bài báo mất hoặc bài nhặt được để mọi người dễ đối chiếu và
                liên hệ nhanh hơn.
              </p>

              {/* 2 CTA chính — khác nhau về kích thước, không giống nhau */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  to="/create-item"
                  className="btn btn-danger btn-lg"
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Đăng tin tìm hoặc nhặt được đồ →
                </Link>
                <button
                  onClick={() => {
                    const target = document.getElementById("item-list");
                    if (target) target.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="btn btn-ghost"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Search size={16} />
                  Tìm bài đăng của tôi
                </button>
              </div>
            </div>

            {/* Cột phải — Stats & Quick Search (không đối xứng hoàn toàn) */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Quick Search */}
              <div className="hero-panel">
                <div className="hero-search-panel">
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Search size={15} color="var(--muted)" />
                    Tìm kiếm nhanh
                  </div>
                  <form
                    onSubmit={handleSearch}
                    style={{ display: "flex", gap: "10px" }}
                  >
                    <input
                      type="text"
                      className="input"
                      placeholder="Chìa khoá, ví, điện thoại..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      Tìm
                    </button>
                  </form>
                </div>
              </div>

              {/* Stats nhỏ — thêm chiều sâu */}
              <div
                className="home-metrics-grid"
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                {[
                  {
                    n: openLostPosts,
                    label: "Bài tìm đồ đang mở",
                    color: "var(--red)",
                    bg: "var(--red-bg)",
                  },
                  {
                    n: openFoundPosts,
                    label: "Bài nhặt được đang mở",
                    color: "var(--amber)",
                    bg: "var(--amber-bg)",
                  },
                  {
                    n: returnedCount,
                    label: "Đã xử lý xong",
                    color: "var(--green)",
                    bg: "var(--green-bg)",
                  },
                ].map((s, i) => (
                  <div key={i} className="hero-stat-card">
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-head)",
                        color: s.color,
                        lineHeight: 1,
                      }}
                    >
                      {s.n}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--muted)",
                        marginTop: "4px",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category tabs — sát dưới hero, như nav bar phụ */}
          <div
            className="hero-category-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "4px",
              marginTop: "var(--s7)",
              borderTop: "1px solid var(--border)",
              paddingTop: "0",
              flexWrap: "wrap",
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive =
                (!category && cat.name === "Tất cả") || category === cat.name;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  aria-pressed={isActive}
                  aria-label={`Loc theo danh muc ${cat.name}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "12px 18px",
                    background: "none",
                    border: "none",
                    borderBottom: isActive
                      ? "2px solid var(--ink)"
                      : "2px solid transparent",
                    marginBottom: "-1px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--ink)" : "var(--muted)",
                    transition: "all 0.15s ease",
                    borderRadius: "0",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon size={15} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =============================================
                ITEM LIST
                ============================================= */}
      <div id="item-list" style={{ padding: "var(--s7) 0" }}>
        <div
          className="container"
          style={{
            maxWidth: "1160px",
            margin: "0 auto",
            padding: "0 var(--s5)",
          }}
        >
          {successNotice ? (
            <div
              className="ui-panel"
              style={{
                marginBottom: "var(--s4)",
                border: "1px solid rgba(28,163,74,0.35)",
                background: "rgba(28,163,74,0.08)",
                color: "var(--green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span style={{ fontWeight: 600 }}>{successNotice}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSuccessNotice("")}
                style={{ flexShrink: 0 }}
              >
                Đóng
              </button>
            </div>
          ) : null}

          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "var(--s4)",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-head)",
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  letterSpacing: "-0.02em",
                  marginBottom: "2px",
                }}
              >
                {loading ? "Đang tải..." : `${filteredItems.length} đồ vật`}
                {category && (
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--muted)",
                      fontSize: "1rem",
                    }}
                  >
                    {" "}
                    trong "{category}"
                  </span>
                )}
                {keyword && (
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--muted)",
                      fontSize: "1rem",
                    }}
                  >
                    {" "}
                    khớp với "{keyword}"
                  </span>
                )}
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                Sắp xếp theo thời gian mới nhất
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "14px",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                marginLeft: "auto",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: "6px",
                  minWidth: "180px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--muted)",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  Trạng thái
                </span>
                <select
                  className="input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    minWidth: "180px",
                    height: "42px",
                    padding: "0 14px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    borderRadius: "12px",
                    background: "var(--white)",
                    border: "1px solid var(--border)",
                    boxShadow: "none",
                  }}
                >
                  {STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "6px",
                  minWidth: "200px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--muted)",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  Thời gian
                </span>
                <select
                  className="input"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  style={{
                    minWidth: "200px",
                    height: "42px",
                    padding: "0 14px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    borderRadius: "12px",
                    background: "var(--white)",
                    border: "1px solid var(--border)",
                    boxShadow: "none",
                  }}
                >
                  {TIME_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div style={{ padding: "var(--s9) 0", textAlign: "center" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  border: "3px solid var(--border)",
                  borderTopColor: "var(--red)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                Đang tải dữ liệu...
              </p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid-cards">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="public-empty">
              <EmptyState
                icon={Box}
                text="Không tìm thấy đồ vật nào"
                hint="Chưa có đồ vật nào khớp với tìm kiếm của bạn."
              />
              {user && (
                <Link
                  to="/create-item"
                  className="btn btn-primary btn-sm"
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Báo cáo đồ bạn nhặt được
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
