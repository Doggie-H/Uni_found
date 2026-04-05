import React from "react";

const MetricCard = ({ icon, label, value, color }) => {
  return (
    <div
      style={{
        background: "var(--white)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          background: color + "15",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon
          ? React.createElement(icon, { size: 20, color, strokeWidth: 2 })
          : null}
      </div>
      <div>
        <div
          style={{
            fontSize: "1.625rem",
            fontWeight: 700,
            fontFamily: "var(--font-head)",
            color: "var(--ink)",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--muted)",
            marginTop: "4px",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
