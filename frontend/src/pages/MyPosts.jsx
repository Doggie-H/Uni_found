import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../api/axios-client";
import getApiErrorMessage from "../utils/get-api-error-message";
import { ClipboardList, RefreshCcw, Trash2, CheckCircle2 } from "lucide-react";

const POST_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "LOST", label: "Bài tìm đồ" },
  { value: "FOUND", label: "Bài nhặt đồ" },
];

const APPROVAL_OPTIONS = [
  { value: "all", label: "Tất cả duyệt" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "FOUND", label: "Đang mở" },
  { value: "RETURNED", label: "Đã hoàn tất" },
];

const approvalLabel = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const statusLabel = {
  FOUND: "Đang mở",
  RETURNED: "Đã hoàn tất",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("vi-VN");
};

const MyPosts = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [postTypeFilter, setPostTypeFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchMyPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (postTypeFilter !== "all") params.post_type = postTypeFilter;
      if (approvalFilter !== "all") params.approval_status = approvalFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await axiosClient.get("/items/mine", { params });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tải bài đăng của bạn."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMyPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, postTypeFilter, approvalFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const lost = items.filter((item) => item.post_type === "LOST").length;
    const found = items.filter((item) => item.post_type === "FOUND").length;
    const done = items.filter((item) => item.status === "RETURNED").length;
    return { total, lost, found, done };
  }, [items]);

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === "RETURNED" ? "FOUND" : "RETURNED";
    const isLostPost = item.post_type === "LOST";
    try {
      const res = await axiosClient.put(`/items/${item.id}/my-status`, {
        status: nextStatus,
      });
      if (nextStatus === "RETURNED") {
        setSuccessNotice(
          res.data?.message ||
            (isLostPost
              ? "Đã đánh dấu bạn đã tìm được vật phẩm. Thông báo đã gửi về admin để theo dõi."
              : "Đã đánh dấu đã trả lại người mất. Thông báo đã gửi về admin để theo dõi."),
        );
      } else {
        setSuccessNotice(
          isLostPost
            ? "Bài tìm đồ đã được mở lại trạng thái đang tìm."
            : "Bài nhặt được đã được mở lại trạng thái đang chờ nhận.",
        );
      }
      await fetchMyPosts();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không thể cập nhật trạng thái bài đăng."));
    }
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`Bạn chắc chắn muốn xoá bài: "${item.title}"?`);
    if (!ok) return;

    try {
      await axiosClient.delete(`/items/${item.id}/my`);
      await fetchMyPosts();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không thể xoá bài đăng."));
    }
  };

  if (!user) {
    return (
      <div className="container page-shell" style={{ textAlign: "center" }}>
        <h2 className="page-title" style={{ marginBottom: "1rem" }}>
          Bạn cần đăng nhập để quản lý bài đăng.
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
    <div className="container page-shell">
      <div className="page-hero" style={{ marginBottom: "1.25rem" }}>
        <div className="page-kicker">
          <ClipboardList size={14} /> Quản lý bài đăng cá nhân
        </div>
        <h1 className="page-title">Bài đăng của tôi</h1>
        <p className="page-subtitle">
          Theo dõi và quản lý các bài báo mất và bài nhặt được bạn đã đăng.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "10px",
          marginBottom: "1rem",
        }}
      >
        <div className="ui-panel" style={{ padding: "10px 12px" }}>
          Tổng: {stats.total}
        </div>
        <div className="ui-panel" style={{ padding: "10px 12px" }}>
          Báo mất: {stats.lost}
        </div>
        <div className="ui-panel" style={{ padding: "10px 12px" }}>
          Nhặt được: {stats.found}
        </div>
        <div className="ui-panel" style={{ padding: "10px 12px" }}>
          Hoàn tất: {stats.done}
        </div>
      </div>

      <div className="ui-panel" style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <select
            className="input"
            value={postTypeFilter}
            onChange={(e) => setPostTypeFilter(e.target.value)}
          >
            {POST_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
          >
            {APPROVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost"
            onClick={fetchMyPosts}
            disabled={loading}
          >
            <RefreshCcw size={14} /> Làm mới
          </button>
        </div>
      </div>

      {error ? (
        <div
          className="ui-panel"
          style={{
            border: "1px solid rgba(232,57,42,0.3)",
            color: "var(--red)",
          }}
        >
          {error}
        </div>
      ) : null}

      {successNotice ? (
        <div
          className="ui-panel"
          style={{
            border: "1px solid rgba(28,163,74,0.3)",
            color: "var(--green)",
            marginBottom: "1rem",
            fontWeight: 600,
          }}
        >
          {successNotice}
        </div>
      ) : null}

      <div className="ui-panel" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border)",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "10px" }}>Tiêu đề</th>
              <th style={{ padding: "10px" }}>Loại</th>
              <th style={{ padding: "10px" }}>Duyệt</th>
              <th style={{ padding: "10px" }}>Trạng thái</th>
              <th style={{ padding: "10px" }}>Ngày</th>
              <th style={{ padding: "10px" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ padding: "16px 10px", color: "var(--muted)" }}
                >
                  Bạn chưa có bài đăng nào theo bộ lọc hiện tại.
                </td>
              </tr>
            ) : null}

            {items.map((item) => (
              <tr
                key={item.id}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td style={{ padding: "10px" }}>
                  <Link
                    to={`/item/${item.id}`}
                    style={{
                      color: "var(--ink)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    {item.title}
                  </Link>
                </td>
                <td style={{ padding: "10px" }}>
                  {item.post_type === "LOST" ? "Bài báo mất" : "Bài nhặt được"}
                </td>
                <td style={{ padding: "10px" }}>
                  {approvalLabel[item.approval_status] || item.approval_status}
                </td>
                <td style={{ padding: "10px" }}>
                  {statusLabel[item.status] || item.status}
                </td>
                <td style={{ padding: "10px" }}>
                  {formatDate(item.created_at)}
                </td>
                <td
                  style={{
                    padding: "10px",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleToggleStatus(item)}
                  >
                    <CheckCircle2 size={14} />
                    {item.status === "RETURNED"
                      ? "Mở lại"
                      : item.post_type === "LOST"
                        ? "Đã tìm được vật phẩm"
                        : "Đã trả lại người mất"}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={14} /> Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyPosts;
