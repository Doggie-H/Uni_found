import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck } from "lucide-react";
import axiosClient from "../api/axios-client";
import { AuthContext } from "../context/AuthContext";
import getApiErrorMessage from "../utils/get-api-error-message";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/notifications", {
        params: { page: 1, limit: 50 },
      });
      const payload = res.data || {};
      setNotifications(Array.isArray(payload.data) ? payload.data : []);
      setUnreadCount(Number(payload.unreadCount || 0));
    } catch (error) {
      alert(getApiErrorMessage(error, "Không thể tải thông báo."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user, fetchNotifications]);

  const markOneRead = async (notificationId) => {
    try {
      await axiosClient.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      alert(getApiErrorMessage(error, "Không thể đánh dấu đã đọc."));
    }
  };

  const markAllRead = async () => {
    setSubmitting(true);
    try {
      await axiosClient.put("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      alert(getApiErrorMessage(error, "Không thể đánh dấu tất cả đã đọc."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container page-shell" style={{ textAlign: "center" }}>
        <h2 className="page-title" style={{ marginBottom: "1rem" }}>
          Bạn cần đăng nhập để xem thông báo.
        </h2>
        <button
          onClick={() => navigate("/login")}
          className="btn btn-danger btn-lg"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="container page-shell" style={{ maxWidth: "860px" }}>
      <div className="page-hero" style={{ marginBottom: "1rem" }}>
        <div className="page-kicker">
          <Bell size={14} /> Trung tâm thông báo
        </div>
        <h1 className="page-title">Thông báo của bạn</h1>
        <p className="page-subtitle">Chưa đọc: {unreadCount}</p>
      </div>

      <div
        style={{
          marginBottom: "12px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          className="btn btn-ghost btn-sm"
          onClick={markAllRead}
          disabled={submitting}
        >
          <CheckCheck size={14} /> Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="ui-panel" style={{ display: "grid", gap: "10px" }}>
        {loading ? (
          <div style={{ color: "var(--muted)" }}>Đang tải thông báo...</div>
        ) : null}

        {!loading && notifications.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>
            Bạn chưa có thông báo nào.
          </div>
        ) : null}

        {!loading
          ? notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "12px",
                  background: item.is_read ? "var(--white)" : "var(--blue-bg)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <strong style={{ color: "var(--ink)" }}>{item.title}</strong>
                  {!item.is_read ? (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => markOneRead(item.id)}
                    >
                      <Check size={14} /> Đã đọc
                    </button>
                  ) : null}
                </div>
                <div style={{ color: "var(--prose)", marginBottom: "6px" }}>
                  {item.body}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                    {formatDateTime(item.created_at)}
                  </span>
                  {item.meta?.item_id ? (
                    <Link
                      to={`/item/${item.meta.item_id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Xem bài liên quan
                    </Link>
                  ) : null}
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  );
};

export default Notifications;
