import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axios-client";
import { AuthContext } from "../context/AuthContext";
import {
  CheckCircle2,
  XCircle,
  Package,
  Users,
  Inbox,
  TrendingUp,
  Download,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SurfaceCard from "../components/ui/SurfaceCard";
import MetricCard from "../components/ui/MetricCard";
import EmptyState from "../components/ui/EmptyState";
import getApiErrorMessage from "../utils/get-api-error-message";
import {
  getAdminCache,
  setAdminCache,
  clearAdminCacheByPrefix,
} from "../utils/admin-list-cache";
import { downloadCsv } from "../utils/export-csv";

const Admin = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({
    items: 0,
    found: 0,
    returned: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [claimPage, setClaimPage] = useState(1);
  const [claimSort, setClaimSort] = useState("created_at:desc");
  const [claimPagination, setClaimPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  useEffect(() => {
    if (!user || user.role !== "admin") navigate("/");
  }, [user, navigate]);

  const buildClaimParams = useCallback(
    (targetPage = claimPage, targetLimit = 10) => ({
      page: targetPage,
      limit: targetLimit,
      sortBy: claimSort.split(":")[0],
      order: claimSort.split(":")[1],
    }),
    [claimPage, claimSort],
  );

  const buildClaimCacheKey = (params) => `claims:${JSON.stringify(params)}`;

  const fetchAll = useCallback(
    async (force = false) => {
      try {
        const claimParams = buildClaimParams();
        const claimCacheKey = buildClaimCacheKey(claimParams);
        let claimData = [];
        let claimPg = { page: 1, totalPages: 1, total: 0, limit: 10 };

        if (!force) {
          const cachedClaims = getAdminCache(claimCacheKey);
          if (cachedClaims) {
            claimData = cachedClaims.data;
            claimPg = cachedClaims.pagination;
          }
        }

        const [claimsRes, itemsRes, usersRes] = await Promise.all([
          claimData.length > 0
            ? Promise.resolve({
                data: { data: claimData, pagination: claimPg },
              })
            : axiosClient.get("/claims", { params: claimParams }),
          axiosClient.get("/items"),
          axiosClient.get("/users"),
        ]);
        const claimsPayload = claimsRes.data;
        claimData = Array.isArray(claimsPayload)
          ? claimsPayload
          : claimsPayload?.data || [];
        claimPg = claimsPayload?.pagination || {
          page: 1,
          totalPages: 1,
          total: claimData.length,
          limit: 10,
        };
        setAdminCache(claimCacheKey, { data: claimData, pagination: claimPg });
        setClaims(claimData);
        setClaimPagination(claimPg);
        const items = itemsRes.data;
        setStats({
          items: items.length,
          found: items.filter((i) => i.status === "FOUND").length,
          returned: items.filter((i) => i.status === "RETURNED").length,
          users: usersRes.data.length,
        });
      } catch (err) {
        console.error(err);
        alert(
          getApiErrorMessage(
            err,
            "Không thể tải dữ liệu quản trị. Vui lòng thử lại.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [buildClaimParams],
  );

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAll();
    }
  }, [user, fetchAll]);

  const handleAction = async (claimId, status) => {
    try {
      await axiosClient.put(`/claims/${claimId}`, { status });
      clearAdminCacheByPrefix("claims:");
      clearAdminCacheByPrefix("items:");
      fetchAll(true);
    } catch (err) {
      console.error(err);
      alert(
        getApiErrorMessage(
          err,
          "Không thể xử lý yêu cầu nhận đồ. Vui lòng thử lại.",
        ),
      );
    }
  };

  const handleExportCsv = async () => {
    try {
      const firstRes = await axiosClient.get("/claims", {
        params: buildClaimParams(1, 100),
      });
      const firstPayload = firstRes.data;
      const firstData = Array.isArray(firstPayload)
        ? firstPayload
        : firstPayload?.data || [];
      const firstPg = firstPayload?.pagination || { totalPages: 1 };

      const allRows = [...firstData];
      for (let p = 2; p <= firstPg.totalPages; p += 1) {
        const pageRes = await axiosClient.get("/claims", {
          params: buildClaimParams(p, 100),
        });
        const payload = pageRes.data;
        const rows = Array.isArray(payload) ? payload : payload?.data || [];
        allRows.push(...rows);
      }

      downloadCsv(
        `claims-${Date.now()}.csv`,
        [
          { key: "id", label: "ID" },
          { key: "item_title", label: "Item" },
          { key: "claimer_username", label: "Claimer" },
          { key: "status", label: "Status" },
          { key: "description", label: "Description" },
          { key: "created_at", label: "Created At" },
        ],
        allRows,
      );
    } catch (err) {
      alert(getApiErrorMessage(err, "Không thể xuất CSV yêu cầu nhận đồ."));
    }
  };

  const pendingClaims = claims.filter((c) => c.status === "PENDING");
  const processedClaims = claims.filter((c) => c.status !== "PENDING");

  const statusBadge = (status) => {
    const map = {
      PENDING: {
        label: "Chờ duyệt",
        bg: "var(--amber-bg)",
        color: "var(--amber)",
      },
      APPROVED: {
        label: "Đã duyệt",
        bg: "var(--green-bg)",
        color: "var(--green)",
      },
      REJECTED: { label: "Từ chối", bg: "var(--red-bg)", color: "var(--red)" },
    };
    const s = map[status] || {
      label: status,
      bg: "var(--surface)",
      color: "var(--muted)",
    };
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 10px",
          borderRadius: "20px",
          background: s.bg,
          color: s.color,
          fontSize: "0.78rem",
          fontWeight: 600,
        }}
      >
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          color: "var(--muted)",
        }}
      >
        Đang tải...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan hoạt động hệ thống UniFound · UED"
      />

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        <MetricCard
          icon={Package}
          label="Tổng đồ vật"
          value={stats.items}
          color="var(--blue)"
        />
        <MetricCard
          icon={TrendingUp}
          label="Đang chờ trả"
          value={stats.found}
          color="var(--amber)"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Đã trả về chủ"
          value={stats.returned}
          color="var(--green)"
        />
        <MetricCard
          icon={Users}
          label="Tài khoản"
          value={stats.users}
          color="var(--red)"
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          Trang {claimPagination.page} / {claimPagination.totalPages} · Tổng{" "}
          {claimPagination.total} yêu cầu nhận đồ
        </span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="btn btn-ghost btn-sm" onClick={handleExportCsv}>
            <Download size={14} /> Export CSV
          </button>
          <select
            className="input"
            value={claimSort}
            onChange={(e) => {
              setClaimSort(e.target.value);
              setClaimPage(1);
            }}
            style={{ maxWidth: "220px" }}
          >
            <option value="created_at:desc">Yêu cầu mới nhất</option>
            <option value="created_at:asc">Yêu cầu cũ nhất</option>
            <option value="status:asc">Status A-Z</option>
            <option value="status:desc">Status Z-A</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <SurfaceCard
          title="Yêu cầu chờ duyệt"
          subtitle={`${pendingClaims.length} yêu cầu cần xử lý`}
          right={
            pendingClaims.length > 0 ? (
              <span
                style={{
                  background: "var(--red)",
                  color: "white",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                {pendingClaims.length} mới
              </span>
            ) : null
          }
          bodyPadding="0"
        >
          {pendingClaims.length === 0 ? (
            <EmptyState
              icon={Inbox}
              text="Không có yêu cầu nào đang chờ duyệt"
            />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  {[
                    "Món đồ",
                    "Người yêu cầu",
                    "Bằng chứng",
                    "Ngày gửi",
                    "Hành động",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 600,
                        color: "var(--ink)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {claim.item_title}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "var(--blue-bg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--blue)",
                            flexShrink: 0,
                          }}
                        >
                          {claim.claimer_username?.charAt(0).toUpperCase()}
                        </div>
                        <span
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--ink)",
                            fontWeight: 500,
                          }}
                        >
                          {claim.claimer_username}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", maxWidth: "260px" }}>
                      <div
                        style={{
                          fontSize: "0.825rem",
                          color: "var(--prose)",
                          background: "var(--surface)",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          lineHeight: 1.5,
                        }}
                      >
                        {claim.description || (
                          <span
                            style={{
                              color: "var(--muted)",
                              fontStyle: "italic",
                            }}
                          >
                            Không có mô tả
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: "0.825rem",
                        color: "var(--muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(claim.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => handleAction(claim.id, "APPROVED")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: "var(--green-bg)",
                            color: "var(--green)",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                        >
                          <CheckCircle2 size={14} /> Duyệt
                        </button>
                        <button
                          onClick={() => handleAction(claim.id, "REJECTED")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: "var(--red-bg)",
                            color: "var(--red)",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                        >
                          <XCircle size={14} /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SurfaceCard>
      </div>

      {/* Processed claims */}
      {processedClaims.length > 0 && (
        <SurfaceCard
          title={`Đã xử lý (${processedClaims.length})`}
          bodyPadding="0"
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {processedClaims.map((claim) => (
                <tr
                  key={claim.id}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      color: "var(--ink)",
                    }}
                  >
                    {claim.item_title}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "0.875rem",
                      color: "var(--muted)",
                    }}
                  >
                    {claim.claimer_username}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {statusBadge(claim.status)}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "0.8rem",
                      color: "var(--muted)",
                    }}
                  >
                    {new Date(claim.created_at).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SurfaceCard>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginTop: "12px",
        }}
      >
        <button
          className="btn btn-ghost btn-sm"
          disabled={claimPagination.page <= 1}
          onClick={() => setClaimPage((p) => Math.max(1, p - 1))}
        >
          Trang trước
        </button>
        <button
          className="btn btn-ghost btn-sm"
          disabled={claimPagination.page >= claimPagination.totalPages}
          onClick={() =>
            setClaimPage((p) => Math.min(claimPagination.totalPages, p + 1))
          }
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default Admin;
