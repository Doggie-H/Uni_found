import React from "react";

const SurfaceCard = ({
  title,
  subtitle,
  right,
  children,
  bodyPadding = "16px 20px",
}) => {
  return (
    <div
      style={{
        background: "var(--white)",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {(title || subtitle || right) && (
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div>
            {title && (
              <h2
                style={{
                  fontFamily: "var(--font-head)",
                  fontSize: "1.02rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  marginTop: "2px",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {right || null}
        </div>
      )}
      <div style={{ padding: bodyPadding }}>{children}</div>
    </div>
  );
};

export default SurfaceCard;
