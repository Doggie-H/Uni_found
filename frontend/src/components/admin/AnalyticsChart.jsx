import React from "react";

const defaultSeries = [
  { key: "visits", label: "Lượt truy cập", color: "var(--blue)" },
  { key: "itemsReported", label: "Bài đăng đồ vật", color: "var(--amber)" },
  { key: "itemsReturned", label: "Đã tìm được", color: "var(--green)" },
];

const AnalyticsChart = ({
  buckets = [],
  series = defaultSeries,
  height = 320,
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
          fontSize: "0.9rem",
          background: "var(--surface)",
          borderRadius: "14px",
        }}
      >
        {emptyText}
      </div>
    );
  }

  const width = Math.max(760, buckets.length * 56 + 40);
  const left = 42;
  const right = 18;
  const top = 24;
  const bottom = 56;
  const chartHeight = height - top - bottom;
  const chartWidth = width - left - right;
  const maxValue = Math.max(
    1,
    ...buckets.flatMap((bucket) =>
      series.map((serie) => Number(bucket?.[serie.key] || 0)),
    ),
  );
  const xStep = chartWidth / buckets.length;
  const barWidth = Math.min(
    12,
    Math.max(8, (xStep - 16) / (series.length || 1)),
  );
  const groupWidth =
    series.length * barWidth + Math.max(0, series.length - 1) * 6;
  const gridLines = 4;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Biểu đồ thống kê"
      >
        <defs>
          <linearGradient id="analytics-bg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--surface)" stopOpacity="0.65" />
            <stop offset="100%" stopColor="var(--white)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={14}
          fill="url(#analytics-bg)"
        />

        {Array.from({ length: gridLines + 1 }).map((_, index) => {
          const y = top + (chartHeight / gridLines) * index;
          const value = Math.round(maxValue - (maxValue / gridLines) * index);
          return (
            <g key={`grid-${index}`}>
              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeDasharray={index === gridLines ? "0" : "4 6"}
              />
              <text
                x={left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--muted)"
              >
                {value}
              </text>
            </g>
          );
        })}

        {buckets.map((bucket, bucketIndex) => {
          const centerX = left + xStep * bucketIndex + xStep / 2;
          const baseX = centerX - groupWidth / 2;
          const labelY = height - 22;
          return (
            <g key={bucket.key || bucket.label || bucketIndex}>
              {series.map((serie, serieIndex) => {
                const value = Number(bucket?.[serie.key] || 0);
                const barHeight = Math.max(
                  (value / maxValue) * chartHeight,
                  value > 0 ? 4 : 0,
                );
                const x = baseX + serieIndex * (barWidth + 6);
                const y = top + chartHeight - barHeight;
                return (
                  <g key={`${bucket.key || bucketIndex}-${serie.key}`}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={6}
                      fill={serie.color}
                      opacity={serie.key === "itemsReturned" ? 0.92 : 1}
                    />
                    {value > 0 && barHeight > 16 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--ink)"
                      >
                        {value}
                      </text>
                    )}
                  </g>
                );
              })}
              <text
                x={centerX}
                y={labelY}
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted)"
              >
                {bucket.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "14px",
        }}
      >
        {series.map((serie) => (
          <div
            key={serie.key}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.82rem",
              color: "var(--muted)",
              padding: "6px 10px",
              borderRadius: "999px",
              background: "var(--surface)",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                background: serie.color,
                display: "inline-block",
              }}
            />
            {serie.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsChart;
