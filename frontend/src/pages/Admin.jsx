import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axios-client";
import { AuthContext } from "../context/AuthContext";
import {
  CheckCircle2,
  XCircle,
  Package,
  Users,
  Inbox,
  Download,
  Activity,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SurfaceCard from "../components/ui/SurfaceCard";
import MetricCard from "../components/ui/MetricCard";
import EmptyState from "../components/ui/EmptyState";
import AnalyticsChart from "../components/admin/AnalyticsChart";
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
  const [dashboard, setDashboard] = useState(null);
  const [claimLoading, setClaimLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [claimPage, setClaimPage] = useState(1);
  const [claimSort, setClaimSort] = useState("created_at:desc");
  const [analyticsRange, setAnalyticsRange] = useState("month");
  const [visits, setVisits] = useState([]);
  const [visitLoading, setVisitLoading] = useState(true);
  const [visitExporting, setVisitExporting] = useState(false);
  const [visitPage, setVisitPage] = useState(1);
  const [visitSort, setVisitSort] = useState("created_at:desc");
  const [visitKeyword, setVisitKeyword] = useState("");
  const [claimPagination, setClaimPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [visitPagination, setVisitPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 12,
  });
  const initialAnalyticsLoadedRef = useRef(false);

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

  const buildVisitParams = useCallback(
    (targetPage = visitPage, targetLimit = 12) => ({
      page: targetPage,
      limit: targetLimit,
      sortBy: visitSort.split(":")[0],
      order: visitSort.split(":")[1],
      keyword: visitKeyword.trim(),
    }),
    [visitPage, visitSort, visitKeyword],
  );

  const buildVisitCacheKey = (params) => `visits:${JSON.stringify(params)}`;

  const fetchClaims = useCallback(
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

        const claimsRes = await Promise.resolve(
          claimData.length > 0
            ? Promise.resolve({
                data: { data: claimData, pagination: claimPg },
              })
            : axiosClient.get("/claims", { params: claimParams }),
        );
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
      } catch (err) {
        console.error(err);
        alert(
          getApiErrorMessage(
            err,
            "Không thể tải dữ liệu quản trị. Vui lòng thử lại.",
          ),
        );
      } finally {
        setClaimLoading(false);
      }
    },
    [buildClaimParams],
  );

  const fetchAnalytics = useCallback(async (range = "month") => {
    setAnalyticsLoading(true);
    try {
      const res = await axiosClient.get("/analytics/admin", {
        params: { range },
      });
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
      alert(
        getApiErrorMessage(
          err,
          "Không thể tải biểu đồ thống kê. Vui lòng thử lại.",
        ),
      );
    } finally {
      setAnalyticsLoading(false);
      initialAnalyticsLoadedRef.current = true;
    }
  }, []);

  const fetchVisits = useCallback(
    async (force = false) => {
      setVisitLoading(true);
      try {
        const visitParams = buildVisitParams();
        const visitCacheKey = buildVisitCacheKey(visitParams);
        let visitData = [];
        let visitPg = { page: 1, totalPages: 1, total: 0, limit: 12 };

        if (!force) {
          const cachedVisits = getAdminCache(visitCacheKey);
          if (cachedVisits) {
            visitData = cachedVisits.data;
            visitPg = cachedVisits.pagination;
          }
        }

        const visitsRes = await Promise.resolve(
          visitData.length > 0
            ? Promise.resolve({
                data: { data: visitData, pagination: visitPg },
              })
            : axiosClient.get("/analytics/visits", {
                params: visitParams,
              }),
        );

        const visitsPayload = visitsRes.data;
        visitData = Array.isArray(visitsPayload)
          ? visitsPayload
          : visitsPayload?.data || [];
        visitPg = visitsPayload?.pagination || {
          page: 1,
          totalPages: 1,
          total: visitData.length,
          limit: 12,
        };

        setAdminCache(visitCacheKey, { data: visitData, pagination: visitPg });
        setVisits(visitData);
        setVisitPagination(visitPg);
      } catch (err) {
        console.error(err);
        alert(
          getApiErrorMessage(
            err,
            "Không thể tải bảng lượt truy cập. Vui lòng thử lại.",
          ),
        );
      } finally {
        setVisitLoading(false);
      }
    },
    [buildVisitParams],
  );

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (initialAnalyticsLoadedRef.current) return;

    const load = async () => {
      setClaimLoading(true);
      setAnalyticsLoading(true);
      await Promise.all([
        fetchClaims(),
        fetchAnalytics(analyticsRange),
        fetchVisits(),
      ]);
    };

    load();
  }, [user, fetchClaims, fetchAnalytics, fetchVisits, analyticsRange]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (!initialAnalyticsLoadedRef.current) return;
    fetchClaims();
  }, [fetchClaims, user]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (!initialAnalyticsLoadedRef.current) return;
    fetchAnalytics(analyticsRange);
  }, [analyticsRange, fetchAnalytics, user]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (!initialAnalyticsLoadedRef.current) return;
    fetchVisits();
  }, [fetchVisits, user]);

  const handleAction = async (claimId, status) => {
    try {
      await axiosClient.put(`/claims/${claimId}`, { status });
      clearAdminCacheByPrefix("claims:");
      clearAdminCacheByPrefix("items:");
      fetchClaims(true);
      fetchAnalytics(analyticsRange);
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

  const handleExportVisitCsv = async () => {
    setVisitExporting(true);
    try {
      const firstRes = await axiosClient.get("/analytics/visits", {
        params: buildVisitParams(1, 200),
      });
      const firstPayload = firstRes.data;
      const firstData = Array.isArray(firstPayload)
        ? firstPayload
        : firstPayload?.data || [];
      const firstPg = firstPayload?.pagination || { totalPages: 1 };

      const allRows = [...firstData];
      for (let p = 2; p <= firstPg.totalPages; p += 1) {
        const pageRes = await axiosClient.get("/analytics/visits", {
          params: buildVisitParams(p, 200),
        });
        const payload = pageRes.data;
        const rows = Array.isArray(payload) ? payload : payload?.data || [];
        allRows.push(...rows);
      }

      downloadCsv(
        `visits-${Date.now()}.csv`,
        [
          { key: "id", label: "ID" },
          { key: "created_at", label: "Created At" },
          { key: "path", label: "Path" },
          { key: "source", label: "Source" },
          { key: "visitor_id", label: "Visitor ID" },
          { key: "session_id", label: "Session ID" },
          { key: "referrer", label: "Referrer" },
          { key: "user_agent", label: "User Agent" },
        ],
        allRows,
      );
    } catch (err) {
      alert(getApiErrorMessage(err, "Không thể xuất CSV lượt truy cập."));
    } finally {
      setVisitExporting(false);
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

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN");
  };

  if (claimLoading && analyticsLoading) {
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

      <SurfaceCard
        title="Biểu đồ thống kê hoạt động"
        subtitle={
          dashboard?.rangeLabel ||
          "Theo dõi lưu lượng truy cập và vật phẩm theo thời gian"
        }
        right={
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { value: "day", label: "Ngày" },
              { value: "week", label: "Tuần" },
              { value: "month", label: "Tháng" },
              { value: "year", label: "Năm" },
            ].map(({ value, label }) => {
              const active = analyticsRange === value;
              return (
                <button
                  key={value}
                  onClick={() => setAnalyticsRange(value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "999px",
                    border: active ? "none" : "1px solid var(--border)",
                    background: active ? "var(--ink)" : "var(--white)",
                    color: active ? "white" : "var(--muted)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Activity size={14} /> {label}
                </button>
              );
            })}
          </div>
        }
      >
        {analyticsLoading && !dashboard ? (
          <div
            style={{
              minHeight: "320px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
            }}
          >
            Đang tải biểu đồ...
          </div>
        ) : (
          <AnalyticsChart
            buckets={dashboard?.buckets || []}
            series={[
              { key: "visits", label: "Lượt truy cập", color: "var(--blue)" },
              {
                key: "itemsReported",
                label: "Bài đăng đồ vật",
                color: "var(--amber)",
              },
              {
                key: "itemsReturned",
                label: "Đã tìm được",
                color: "var(--green)",
              },
            ]}
          />
        )}
      </SurfaceCard>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "32px",
          marginTop: "20px",
        }}
      >
        <MetricCard
          icon={Activity}
          label={`Lượt truy cập ${dashboard?.rangeLabel ? dashboard.rangeLabel.toLowerCase() : "tháng"}`}
          value={dashboard?.overview?.currentRangeVisits || 0}
          color="var(--blue)"
        />
        <MetricCard
          icon={Package}
          label="Tổng đồ vật"
          value={dashboard?.overview?.totalItems || 0}
          color="var(--amber)"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Đã tìm được"
          value={dashboard?.overview?.totalReturnedItems || 0}
          color="var(--green)"
        />
        <MetricCard
          icon={Users}
          label="Tài khoản"
          value={dashboard?.overview?.totalUsers || 0}
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

      <div style={{ marginTop: "26px", marginBottom: "14px" }}>
        <SurfaceCard
          title="Lượt truy cập web"
          subtitle={`Trang ${visitPagination.page}/${visitPagination.totalPages} · ${visitPagination.total} bản ghi`}
          bodyPadding="0"
          right={
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <input
                className="input"
                value={visitKeyword}
                onChange={(e) => {
                  setVisitKeyword(e.target.value);
                  setVisitPage(1);
                }}
                placeholder="Tìm path, source, referrer"
                style={{ minWidth: "240px" }}
              />
              <select
                className="input"
                value={visitSort}
                onChange={(e) => {
                  setVisitSort(e.target.value);
                  setVisitPage(1);
                }}
                style={{ maxWidth: "220px" }}
              >
                <option value="created_at:desc">Mới nhất</option>
                <option value="created_at:asc">Cũ nhất</option>
                <option value="path:asc">Path A-Z</option>
                <option value="path:desc">Path Z-A</option>
                <option value="source:asc">Source A-Z</option>
                <option value="source:desc">Source Z-A</option>
              </select>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleExportVisitCsv}
                disabled={visitExporting}
              >
                <Download size={14} />
                {visitExporting ? "Đang xuất..." : "Export CSV truy cập"}
              </button>
            </div>
          }
        >
          {visitLoading ? (
            <div
              style={{
                padding: "20px 16px",
                color: "var(--muted)",
                fontSize: "0.9rem",
              }}
            >
              Đang tải dữ liệu truy cập...
            </div>
          ) : visits.length === 0 ? (
            <EmptyState icon={Activity} text="Không có dữ liệu lượt truy cập" />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface)" }}>
                    {[
                      "Thời gian",
                      "Path",
                      "Source",
                      "Visitor",
                      "Session",
                      "Referrer",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          color: "var(--muted)",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit) => (
                    <tr
                      key={visit.id}
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "0.82rem",
                          color: "var(--muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDateTime(visit.created_at)}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontFamily: "monospace",
                          fontSize: "0.82rem",
                          color: "var(--ink)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {visit.path || "-"}
                      </td>
                      <td style={{ padding: "12px", fontSize: "0.82rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background: "var(--blue-bg)",
                            color: "var(--blue)",
                            fontWeight: 600,
                          }}
                        >
                          {visit.source || "direct"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontFamily: "monospace",
                          fontSize: "0.76rem",
                          color: "var(--prose)",
                          maxWidth: "160px",
                        }}
                      >
                        {visit.visitor_id || "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontFamily: "monospace",
                          fontSize: "0.76rem",
                          color: "var(--prose)",
                          maxWidth: "160px",
                        }}
                      >
                        {visit.session_id || "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "0.8rem",
                          color: "var(--muted)",
                          maxWidth: "280px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={visit.referrer || ""}
                      >
                        {visit.referrer || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      </div>

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
          disabled={visitPagination.page <= 1 || visitLoading}
          onClick={() => setVisitPage((p) => Math.max(1, p - 1))}
        >
          Trang trước
        </button>
        <button
          className="btn btn-ghost btn-sm"
          disabled={
            visitPagination.page >= visitPagination.totalPages || visitLoading
          }
          onClick={() =>
            setVisitPage((p) => Math.min(visitPagination.totalPages, p + 1))
          }
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default Admin;
