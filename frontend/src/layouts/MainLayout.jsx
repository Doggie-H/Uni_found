import React, { useContext, useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../api/axios-client";
import {
  LogOut,
  PlusCircle,
  Shield,
  MessageCircle,
  ClipboardList,
  Bell,
} from "lucide-react";
import BrandMark from "../components/ui/BrandMark";

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let mounted = true;
    const fetchUnreadCount = async () => {
      try {
        const res = await axiosClient.get("/notifications", {
          params: { unreadOnly: true, page: 1, limit: 1 },
        });
        if (mounted) {
          setUnreadCount(Number(res.data?.unreadCount || 0));
        }
      } catch {
        if (mounted) setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 15000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className="app-shell"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {/* ===================== HEADER ===================== */}
      <header
        className="main-header"
        style={{
          backgroundColor: "var(--white)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="main-header-inner"
          style={{
            maxWidth: "1160px",
            margin: "0 auto",
            padding: "0 var(--s5)",
            height: "62px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* ---- LOGO: typography làm điểm nhấn ---- */}
          <Link
            className="brand-link"
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0",
            }}
          >
            <BrandMark />
          </Link>

          {/* ---- NAV RIGHT ---- */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user ? (
              <>
                {/* Avatar + tên */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "var(--blue-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-head)",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: "var(--blue)",
                      flexShrink: 0,
                    }}
                  >
                    {(user.full_name || user.username)?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ lineHeight: 1.3 }}>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {user.full_name || user.username}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                      {user.role === "admin"
                        ? "⚙ Quản trị viên"
                        : user.khoa_hoc
                          ? `MSV · ${user.khoa_hoc}`
                          : user.username}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    width: "1px",
                    height: "22px",
                    background: "var(--border)",
                  }}
                />

                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      borderRadius: "var(--r-md)",
                      background: "var(--amber-bg)",
                      color: "var(--amber)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      border: "1px solid rgba(217,119,6,0.2)",
                    }}
                  >
                    <Shield size={14} /> Quản trị
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() =>
                    alert("Nhắn tin đang phát triển (Coming Soon).")
                  }
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <MessageCircle size={14} /> Nhắn tin
                </button>

                <Link
                  to="/notifications"
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                    position: "relative",
                  }}
                >
                  <Bell size={14} /> Thông báo
                  {unreadCount > 0 ? (
                    <span
                      style={{
                        minWidth: "18px",
                        height: "18px",
                        borderRadius: "999px",
                        background: "var(--red)",
                        color: "#fff",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 5px",
                      }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Link>

                <Link
                  to="/my-posts"
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                  }}
                >
                  <ClipboardList size={14} /> Bài của tôi
                </Link>

                {/* CTA chính */}
                <Link
                  to="/create-item"
                  className="btn btn-danger btn-sm"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    textDecoration: "none",
                  }}
                >
                  <PlusCircle size={15} />
                  Đăng tin
                </Link>

                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    padding: "7px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--red)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--muted)")
                  }
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-ghost btn-sm"
                  style={{
                    textDecoration: "none",
                  }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/login?tab=register"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    // Sẽ bắt qua state nếu cần
                  }}
                  style={{
                    textDecoration: "none",
                  }}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className="main-content"
        style={{ flex: 1, backgroundColor: "var(--bg)" }}
      >
        <Outlet />
      </main>

      {/* ===================== FOOTER ===================== */}
      <footer
        className="main-footer"
        style={{
          borderTop: "1px solid var(--border)",
          backgroundColor: "var(--white)",
          padding: "24px 0",
        }}
      >
        <div
          style={{
            maxWidth: "1160px",
            margin: "0 auto",
            padding: "0 var(--s5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BrandMark compact subtitle={false} />
            <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
              · Trường ĐH Sư phạm – ĐH Đà Nẵng
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
            459 Tôn Đức Thắng, Hòa Khánh, TP. Đà Nẵng
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
