import React, { useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axios-client";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Trash2,
  Download,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SurfaceCard from "../components/ui/SurfaceCard";
import EmptyState from "../components/ui/EmptyState";
import getApiErrorMessage from "../utils/get-api-error-message";
import { getItemImageCount, getPrimaryItemImage } from "../utils/item-images";
import {
  getAdminCache,
  setAdminCache,
  clearAdminCacheByPrefix,
} from "../utils/admin-list-cache";
import { downloadCsv } from "../utils/export-csv";

const categoryColor = {
  "Ví/Giấy tờ": "#3B82F6",
  "Đồ Điện Tử": "#8B5CF6",
  "Chìa Khoá": "#F59E0B",
  "Căn cước/Thẻ": "#10B981",
  Khác: "#6B7280",
};

const normalizeCategory = (value) => {
  const raw = (value || "").toString().trim();
  if (!raw) return "Khác";

  const lower = raw.toLowerCase();
  if (lower === "khac" || /^kh.c$/i.test(raw)) {
    return "Khác";
  }

  return raw;
};

const AdminItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 12,
  });
  const [sort, setSort] = useState("created_at:desc");

  const buildParams = useCallback(
    (targetPage = page, targetLimit = 12) => {
      const params = { page: targetPage, limit: targetLimit };
      if (filter !== "ALL") params.status = filter;
      const [sortBy, order] = sort.split(":");
      params.sortBy = sortBy;
      params.order = order;
      return params;
    },
    [page, filter, sort],
  );

  const buildCacheKey = (params) => `items:${JSON.stringify(params)}`;

  const fetchItems = useCallback(
    async (force = false) => {
      try {
        const params = buildParams();
        const cacheKey = buildCacheKey(params);

        if (!force) {
          const cached = getAdminCache(cacheKey);
          if (cached) {
            setItems(cached.data);
            setPagination(cached.pagination);
            setLoading(false);
            return;
          }
        }

        const res = await axiosClient.get("/items", { params });
        const payload = res.data;
        const data = Array.isArray(payload) ? payload : payload?.data || [];
        const pg = payload?.pagination || {
          page: 1,
          totalPages: 1,
          total: data.length,
          limit: 12,
        };
        setAdminCache(cacheKey, { data, pagination: pg });
        setItems(data);
        setPagination(pg);
      } catch (err) {
        console.error(err);
        alert(getApiErrorMessage(err, "Không thể tải danh sách đồ vật."));
      } finally {
        setLoading(false);
      }
    },
    [buildParams],
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleStatusChange = async (id, status) => {
    try {
      await axiosClient.put(`/items/${id}`, { status });
      clearAdminCacheByPrefix("items:");
      fetchItems(true);
    } catch (err) {
      console.error(err);
      alert(getApiErrorMessage(err, "Cập nhật trạng thái thất bại."));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa đồ vật này khỏi hệ thống?")) return;
    try {
      await axiosClient.delete(`/items/${id}`);
      clearAdminCacheByPrefix("items:");
      fetchItems(true);
    } catch (err) {
      console.error(err);
      alert(getApiErrorMessage(err, "Xóa đồ vật thất bại."));
    }
  };

  const handleExportCsv = async () => {
    try {
      const firstRes = await axiosClient.get("/items", {
        params: buildParams(1, 100),
      });
      const firstPayload = firstRes.data;
      const firstData = Array.isArray(firstPayload)
        ? firstPayload
        : firstPayload?.data || [];
      const firstPg = firstPayload?.pagination || { totalPages: 1 };

      const allRows = [...firstData];
      for (let p = 2; p <= firstPg.totalPages; p += 1) {
        const pageRes = await axiosClient.get("/items", {
          params: buildParams(p, 100),
        });
        const payload = pageRes.data;
        const rows = Array.isArray(payload) ? payload : payload?.data || [];
        allRows.push(...rows);
      }

      downloadCsv(
        `items-${Date.now()}.csv`,
        [
          { key: "id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "category", label: "Category" },
          { key: "status", label: "Status" },
          { key: "location", label: "Location" },
          { key: "date_lost_found", label: "Date Lost Found" },
          { key: "created_at", label: "Created At" },
        ],
        allRows,
      );
    } catch (err) {
      alert(getApiErrorMessage(err, "Không thể xuất CSV đồ vật."));
    }
  };

  const filtered = items;

  const daysAgo = (dateStr) => {
    if (!dateStr) return null;
    const ts = new Date(dateStr).getTime();
    if (Number.isNaN(ts)) return null;
    const diff = Math.floor((Date.now() - ts) / 86400000);
    return Math.max(0, diff);
  };

  const urgencyColor = (d) => {
    if (d === null) return "var(--muted)";
    if (d <= 2) return "var(--green)";
    if (d <= 7) return "var(--amber)";
    return "var(--red)";
  };

  if (loading)
    return (
      <div
        style={{ padding: "60px", textAlign: "center", color: "var(--muted)" }}
      >
        Đang tải...
      </div>
    );

  return (
    <div>
      <PageHeader
        title="Quản lý Đồ vật"
        subtitle={`${items.length} đồ vật trong hệ thống`}
      />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[
          { v: "ALL", label: "Tất cả" },
          { v: "FOUND", label: "Chờ trả" },
          { v: "RETURNED", label: "Đã trả" },
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
              background: filter === v ? "var(--ink)" : "var(--white)",
              color: filter === v ? "white" : "var(--muted)",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              border: filter === v ? "none" : "1px solid var(--border)",
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
          marginBottom: "12px",
          color: "var(--muted)",
          fontSize: "0.85rem",
        }}
      >
        <span>
          Trang {pagination.page} / {pagination.totalPages} · Tổng{" "}
          {pagination.total} đồ vật
        </span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
            style={{ maxWidth: "220px", marginLeft: "12px" }}
          >
            <option value="created_at:desc">Mới nhất trước</option>
            <option value="created_at:asc">Cũ nhất trước</option>
            <option value="date_lost_found:desc">Ngày mới nhất</option>
            <option value="date_lost_found:asc">Ngày cũ nhất</option>
          </select>
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

      <SurfaceCard bodyPadding="0">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface)" }}>
              {[
                "Đồ vật",
                "Danh mục",
                "Vị trí",
                "Thời gian",
                "Trạng thái",
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
            {filtered.map((item) => {
              const d = daysAgo(item.date_lost_found);
              const uc = urgencyColor(d);
              const categoryLabel = normalizeCategory(item.category);
              const categoryTone = categoryColor[categoryLabel] || "#6B7280";
              const primaryImageUrl = getPrimaryItemImage(item);
              const imageCount = getItemImageCount(item);
              return (
                <tr
                  key={item.id}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  {/* Đồ vật */}
                  <td style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {primaryImageUrl ? (
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <img
                            src={primaryImageUrl}
                            alt={item.title || "Ảnh đồ vật"}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "6px",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                          {imageCount > 1 ? (
                            <span
                              style={{
                                position: "absolute",
                                right: "-6px",
                                bottom: "-6px",
                                padding: "2px 5px",
                                borderRadius: "999px",
                                background: "rgba(15, 23, 42, 0.9)",
                                color: "#fff",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                lineHeight: 1,
                                border: "1px solid rgba(255,255,255,0.9)",
                              }}
                            >
                              {imageCount}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "6px",
                            background: "var(--surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Package size={16} color="var(--muted)" />
                        </div>
                      )}
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--ink)",
                            lineHeight: 1.3,
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--muted)",
                            marginTop: "2px",
                          }}
                        >
                          #{item.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Category */}
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: categoryTone,
                        background: categoryTone + "15",
                      }}
                    >
                      {categoryLabel}
                    </span>
                  </td>
                  {/* Location */}
                  <td style={{ padding: "14px 16px", maxWidth: "220px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "5px",
                      }}
                    >
                      <MapPin
                        size={13}
                        color="var(--muted)"
                        style={{ flexShrink: 0, marginTop: "2px" }}
                      />
                      <span
                        style={{
                          fontSize: "0.825rem",
                          color: "var(--prose)",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.location}
                      </span>
                    </div>
                  </td>
                  {/* Time */}
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "0.825rem",
                        color: uc,
                        fontWeight: 600,
                      }}
                    >
                      <Clock size={13} />
                      {d === null
                        ? "Không rõ ngày"
                        : d === 0
                          ? "Hôm nay"
                          : d === 1
                            ? "Hôm qua"
                            : `${d} ngày trước`}
                    </div>
                  </td>
                  {/* Status */}
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        background:
                          item.status === "FOUND"
                            ? "var(--green-bg)"
                            : "var(--surface)",
                        color:
                          item.status === "FOUND"
                            ? "var(--green)"
                            : "var(--muted)",
                      }}
                    >
                      {item.status === "FOUND" ? "Đang chờ" : "Đã trả"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {item.status === "FOUND" && (
                        <button
                          onClick={() =>
                            handleStatusChange(item.id, "RETURNED")
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            border: "none",
                            background: "var(--blue-bg)",
                            color: "var(--blue)",
                            fontWeight: 600,
                            fontSize: "0.78rem",
                            cursor: "pointer",
                          }}
                        >
                          <CheckCircle2 size={13} /> Đã trả
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
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
                        }}
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <EmptyState icon={Package} text="Không có đồ vật nào" />
        )}
      </SurfaceCard>
    </div>
  );
};

export default AdminItems;
