import React from "react";

const EmptyState = ({ icon: Icon, text, hint }) => {
  return (
    <div
      style={{
        padding: "52px 24px",
        textAlign: "center",
        color: "var(--muted)",
      }}
    >
      {Icon ? (
        <Icon size={34} style={{ opacity: 0.35, marginBottom: "12px" }} />
      ) : null}
      <p style={{ fontSize: "0.95rem", color: "var(--ink)" }}>{text}</p>
      {hint ? (
        <p style={{ fontSize: "0.84rem", marginTop: "6px" }}>{hint}</p>
      ) : null}
    </div>
  );
};

export default EmptyState;
