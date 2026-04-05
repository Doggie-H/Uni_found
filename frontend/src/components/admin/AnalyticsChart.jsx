import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  Line,
} from "recharts";

const defaultSeries = [
  { key: "visits", label: "Lượt truy cập", color: "#2563EB" },
  { key: "itemsReported", label: "Bài đăng đồ vật", color: "#D97706" },
  { key: "itemsReturned", label: "Đã tìm được", color: "#16A34A" },
];

const formatTick = (value) => {
  if (!Number.isFinite(value)) return "0";
  if (Number.isInteger(value)) return String(value);
  return Number(value)
    .toFixed(value < 1 ? 2 : 1)
    .replace(/\.0+$/, "");
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        boxShadow: "var(--shadow-md)",
        padding: "10px 12px",
        minWidth: "180px",
      }}
    >
      <div
        style={{
          fontSize: "0.82rem",
          color: "var(--muted)",
          marginBottom: "8px",
          fontWeight: 600,
        }}
      >
        Mốc thời gian: {label}
      </div>

      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "5px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              color: "var(--ink)",
              fontSize: "0.82rem",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: entry.color,
                display: "inline-block",
              }}
            />
            {entry.name}
          </span>
          <strong style={{ color: "var(--ink)", fontSize: "0.85rem" }}>
            {formatTick(Number(entry.value))}
          </strong>
        </div>
      ))}
    </div>
  );
};

const AnalyticsChart = ({
  buckets = [],
  series = defaultSeries,
  height = 360,
  emptyText = "Chưa có dữ liệu để hiển thị biểu đồ.",
}) => {
  if (!buckets.length) {
    return (
      <div
        style={{
          minHeight: `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontSize: "0.92rem",
          background: "linear-gradient(180deg, var(--surface), var(--white))",
          border: "1px solid var(--border)",
          borderRadius: "16px",
        }}
      >
        {emptyText}
      </div>
    );
  }

  const totals = series.map((serie) => ({
    ...serie,
    total: buckets.reduce(
      (sum, bucket) => sum + Number(bucket?.[serie.key] || 0),
      0,
    ),
  }));

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        {totals.map((item) => (
          <div
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--muted)",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  background: item.color,
                  display: "inline-block",
                }}
              />
              {item.label}
            </span>
            <strong style={{ color: "var(--ink)", fontSize: "1rem" }}>
              {item.total}
            </strong>
          </div>
        ))}
      </div>

      <div
        style={{
          height,
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "12px 14px 6px",
          background: "var(--white)",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={buckets}
            margin={{ top: 14, right: 16, left: 2, bottom: 8 }}
          >
            <defs>
              <linearGradient id="visitsArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="4 6"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              minTickGap={16}
            />

            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={34}
              allowDecimals={false}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
            />

            <Legend
              verticalAlign="bottom"
              align="left"
              iconType="circle"
              iconSize={9}
              wrapperStyle={{ paddingTop: 10 }}
            />

            <Area
              type="monotone"
              dataKey="visits"
              name="Lượt truy cập"
              stroke="#2563EB"
              strokeWidth={2.8}
              fill="url(#visitsArea)"
              dot={false}
              activeDot={{ r: 5 }}
            />

            <Line
              type="monotone"
              dataKey="itemsReported"
              name="Bài đăng đồ vật"
              stroke="#D97706"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4 }}
            />

            <Line
              type="monotone"
              dataKey="itemsReturned"
              name="Đã tìm được"
              stroke="#16A34A"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
