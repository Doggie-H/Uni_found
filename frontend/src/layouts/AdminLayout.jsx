import React, { useContext, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  ShieldCheck,
  LogOut,
  Inbox,
  Package,
  Users,
  Home,
  ChevronRight,
} from "lucide-react";

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "admin") {
      navigate("/");
    }
  }, [navigate, user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { to: "/admin", icon: Inbox, label: "Yêu cầu nhận đồ", exact: true },
    { to: "/admin/items", icon: Package, label: "Quản lý Đồ vật" },
    { to: "/admin/users", icon: Users, label: "Quản lý Người dùng" },
  ];

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div
      className="admin-shell"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--surface)",
      }}
    >
      {/* ============ SIDEBAR ============ */}
      <aside
        className="admin-sidebar"
        style={{
          width: "248px",
          flexShrink: 0,
          background: "var(--ink)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "7px",
                background: "var(--red)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={17} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-head)",
                  fontWeight: 800,
                  fontSize: "1rem",
                  color: "white",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                UniAdmin
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "rgba(255,255,255,0.4)",
                  marginTop: "2px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Bảng điều khiển
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav
          style={{
            padding: "16px 12px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {navItems.map((navItem) => {
            const active = isActive(navItem.to, navItem.exact);
            const NavIcon = navItem.icon;
            return (
              <Link
                key={navItem.to}
                to={navItem.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 500,
                  color: active ? "white" : "rgba(255,255,255,0.5)",
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <NavIcon size={16} strokeWidth={2} />
                {navItem.label}
                {active && (
                  <ChevronRight
                    size={14}
                    style={{ marginLeft: "auto", opacity: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Back to site + User info */}
        <div
          style={{
            padding: "16px 12px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.8rem",
              fontWeight: 500,
              textDecoration: "none",
              marginBottom: "12px",
              transition: "color 0.15s",
            }}
          >
            <Home size={14} /> Về trang chủ
          </Link>

          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: "8px",
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "white" }}
              >
                {user?.full_name || user?.username || "Admin"}
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "rgba(255,255,255,0.35)",
                  marginTop: "2px",
                }}
              >
                Quản trị viên
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px",
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <main
        className="admin-main"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "36px 40px",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
