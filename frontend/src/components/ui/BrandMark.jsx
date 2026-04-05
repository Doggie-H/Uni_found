import React from "react";

const BrandMark = ({ compact = false, dark = false, subtitle = true }) => {
  const textColor = dark ? "white" : "var(--ink)";
  const subColor = dark ? "rgba(255,255,255,0.6)" : "var(--muted)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: compact ? "30px" : "36px",
          height: compact ? "30px" : "36px",
          borderRadius: compact ? "7px" : "8px",
          background: "var(--red)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: compact ? "1rem" : "1.25rem",
          fontFamily: "var(--font-head)",
          fontWeight: 900,
          color: "white",
          letterSpacing: "-0.04em",
          flexShrink: 0,
          lineHeight: 1,
          paddingBottom: "1px",
        }}
      >
        U
      </div>

      <div style={{ lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-head)",
            fontSize: compact ? "1rem" : "1.1875rem",
            fontWeight: 800,
            color: textColor,
            letterSpacing: "-0.04em",
          }}
        >
          Uni
        </span>
        <span
          style={{
            fontFamily: "var(--font-head)",
            fontSize: compact ? "1rem" : "1.1875rem",
            fontWeight: 800,
            color: "var(--red)",
            letterSpacing: "-0.04em",
          }}
        >
          Found
        </span>
        {subtitle && (
          <span
            style={{
              display: "block",
              fontSize: compact ? "0.58rem" : "0.62rem",
              fontWeight: 600,
              color: subColor,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              lineHeight: 1,
              marginTop: "2px",
            }}
          >
            UED · Đà Nẵng
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandMark;
