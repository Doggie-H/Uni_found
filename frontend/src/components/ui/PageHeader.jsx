import React from "react";

const PageHeader = ({ title, subtitle, kicker, actions }) => {
  return (
    <div
      style={{
        marginBottom: "24px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <div>
        {kicker && (
          <div className="page-kicker" style={{ marginBottom: "8px" }}>
            {kicker}
          </div>
        )}
        <h1
          style={{
            fontFamily: "var(--font-head)",
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.03em",
            marginBottom: "4px",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
};

export default PageHeader;
