import React, { useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axios-client";
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Trash2,
  Search,
  UserX,
  Download,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SurfaceCard from "../components/ui/SurfaceCard";
import EmptyState from "../components/ui/EmptyState";
import getApiErrorMessage from "../utils/get-api-error-message";
import useDebouncedValue from "../hooks/use-debounced-value";
import {
  getAdminCache,
  setAdminCache,
  clearAdminCacheByPrefix,
} from "../utils/admin-list-cache";
import { downloadCsv } from "../utils/export-csv";

const roleColor = {
  admin: {
    bg: "var(--amber-bg)",
    color: "var(--amber)",
    label: "Quản trị viên",
  },
  user: { bg: "var(--blue-bg)", color: "var(--blue)", label: "Sinh viên" },
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | admin | user
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 12,
  });
  const [sort, setSort] = useState("created_at:desc");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const buildParams = useCallback(
    (targetPage = page, targetLimit = 12) => {
      const params = { page: targetPage, limit: targetLimit };
      if (filter !== "ALL") params.role = filter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const [sortBy, order] = sort.split(":");
      params.sortBy = sortBy;
      params.order = order;
      return params;
    },
    [page, filter, sort, debouncedSearch],
  );

  const buildCacheKey = (params) => `users:${JSON.stringify(params)}`;

  const fetchUsers = useCallback(
    async (force = false) => {
      try {
        const params = buildParams();
        const cacheKey = buildCacheKey(params);

        if (!force) {
          const cached = getAdminCache(cacheKey);
          if (cached) {
            setUsers(cached.data);
            setPagination(cached.pagination);
            setLoading(false);
            return;
          }
        }

        const res = await axiosClient.get("/users", { params });
        const payload = res.data;
        const data = Array.isArray(payload) ? payload : payload?.data || [];
        const pg = payload?.pagination || {
          page: 1,
          totalPages: 1,
          total: data.length,
          limit: 12,
        };
        setAdminCache(cacheKey, { data, pagination: pg });
        setUsers(data);
        setPagination(pg);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách người dùng:", err);
        alert(getApiErrorMessage(err, "Không thể tải danh sách người dùng."));
      } finally {
        setLoading(false);
      }
    },
    [buildParams],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Xóa tài khoản "${username}" khỏi hệ thống?`)) return;
    try {
      await axiosClient.delete(`/users/${id}`);
      clearAdminCacheByPrefix("users:");
      fetchUsers(true);
    } catch (err) {
      alert(getApiErrorMessage(err, "Xóa thất bại. Vui lòng thử lại."));
    }
  };

  const handleExportCsv = async () => {
    try {
      const firstRes = await axiosClient.get("/users", {
        params: buildParams(1, 100),
      });
      const firstPayload = firstRes.data;
      const firstData = Array.isArray(firstPayload)
        ? firstPayload
        : firstPayload?.data || [];
      const firstPg = firstPayload?.pagination || {
        page: 1,
        totalPages: 1,
      };

      const allRows = [...firstData];
      for (let p = 2; p <= firstPg.totalPages; p += 1) {
        const pageRes = await axiosClient.get("/users", {
          params: buildParams(p, 100),
        });
        const payload = pageRes.data;
        const rows = Array.isArray(payload) ? payload : payload?.data || [];
        allRows.push(...rows);
      }

      downloadCsv(
        `users-${Date.now()}.csv`,
        [
          { key: "id", label: "ID" },
          { key: "username", label: "Username" },
          { key: "full_name", label: "Full Name" },
          { key: "khoa", label: "Khoa" },
          { key: "nganh", label: "Nganh" },
          { key: "khoa_hoc", label: "Khoa Hoc" },
          { key: "role", label: "Role" },
          { key: "created_at", label: "Created At" },
        ],
        allRows,
      );
    } catch (err) {
      alert(getApiErrorMessage(err, "Không thể xuất CSV người dùng."));
    }
  };

  const visible = users;

  const studentCount = users.filter((u) => u.role !== "admin").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid var(--border)",
            borderTopColor: "var(--red)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Quản lý Người dùng"
        subtitle={`${pagination.total} tài khoản · ${studentCount} sinh viên · ${adminCount} quản trị viên`}
        actions={
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search
              size={15}
              color="var(--muted)"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Tìm tên, MSV, khoa..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: "36px", fontSize: "0.875rem" }}
            />
          </div>
        }
      />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[
          { v: "ALL", label: `Tất cả (${users.length})` },
          { v: "user", label: `Sinh viên (${studentCount})` },
          { v: "admin", label: `Quản trị viên (${adminCount})` },
        ].map(({ v, label }) => (
          <button
            key={v}
            onClick={() => {
              setFilter(v);
              setPage(1);
            }}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              background: filter === v ? "var(--ink)" : "var(--white)",
              color: filter === v ? "white" : "var(--muted)",
              border: filter === v ? "none" : "1px solid var(--border)",
              fontWeight: 600,
              fontSize: "0.875rem",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          gap: "12px",
        }}
      >
        <button className="btn btn-ghost btn-sm" onClick={handleExportCsv}>
          <Download size={14} /> Export CSV
        </button>
        <select
          className="input"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: "240px" }}
        >
          <option value="created_at:desc">Mới nhất trước</option>
          <option value="created_at:asc">Cũ nhất trước</option>
          <option value="username:asc">MSV A-Z</option>
          <option value="username:desc">MSV Z-A</option>
        </select>
      </div>

      <SurfaceCard bodyPadding="0">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface)" }}>
              {[
                "Người dùng",
                "Mã SV / Tài khoản",
                "Khoa / Ngành",
                "Khóa học",
                "Vai trò",
                "Hành động",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "11px 16px",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => {
              const role = roleColor[u.role] || roleColor.user;
              const isAdmin = u.role === "admin";
              const initials = (u.full_name || u.username || "?")
                .charAt(0)
                .toUpperCase();

              return (
                <tr
                  key={u.id}
                  style={{
                    borderTop: "1px solid var(--border)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Avatar + họ tên */}
                  <td style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: isAdmin
                            ? "var(--amber-bg)"
                            : "var(--blue-bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-head)",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          color: isAdmin ? "var(--amber)" : "var(--blue)",
                        }}
                      >
                        {isAdmin ? <ShieldCheck size={16} /> : initials}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--ink)",
                            lineHeight: 1.3,
                          }}
                        >
                          {u.full_name || u.username}
                        </div>
                        {u.full_name && u.full_name !== u.username && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--muted)",
                              marginTop: "1px",
                            }}
                          >
                            #{u.id}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* MSV / tên tài khoản */}
                  <td style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <GraduationCap size={13} color="var(--muted)" />
                      <code
                        style={{
                          fontSize: "0.8rem",
                          fontFamily: "monospace",
                          background: "var(--surface)",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          color: "var(--ink)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {u.username}
                      </code>
                    </div>
                  </td>

                  {/* Khoa / Ngành */}
                  <td style={{ padding: "14px 16px", maxWidth: "220px" }}>
                    {u.khoa ? (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.8rem",
                            color: "var(--ink)",
                            fontWeight: 500,
                          }}
                        >
                          <BookOpen size={12} color="var(--muted)" />
                          {u.khoa}
                        </div>
                        {u.nganh && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--muted)",
                              marginTop: "2px",
                              paddingLeft: "17px",
                            }}
                          >
                            {u.nganh}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--muted)",
                          fontStyle: "italic",
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>

                  {/* Khóa học */}
                  <td style={{ padding: "14px 16px" }}>
                    {u.khoa_hoc ? (
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          background: "var(--blue-bg)",
                          color: "var(--blue)",
                          fontFamily: "var(--font-head)",
                        }}
                      >
                        {u.khoa_hoc}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--muted)",
                          fontStyle: "italic",
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>

                  {/* Vai trò */}
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        background: role.bg,
                        color: role.color,
                      }}
                    >
                      {role.label}
                    </span>
                  </td>

                  {/* Hành động */}
                  <td style={{ padding: "14px 16px" }}>
                    {isAdmin ? (
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--muted)",
                          fontStyle: "italic",
                        }}
                      >
                        Bảo vệ
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          border: "none",
                          background: "var(--red-bg)",
                          color: "var(--red)",
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {visible.length === 0 && (
          <EmptyState
            icon={UserX}
            text={
              searchInput
                ? `Không tìm thấy người dùng khớp với "${searchInput}"`
                : "Không có người dùng nào"
            }
          />
        )}
      </SurfaceCard>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "14px",
          color: "var(--muted)",
          fontSize: "0.85rem",
        }}
      >
        <span>
          Trang {pagination.page} / {pagination.totalPages} · Tổng{" "}
          {pagination.total} tài khoản
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trang trước
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
