import React from "react";
import { MessageCircle } from "lucide-react";

const Messages = () => {
  return (
    <div className="container page-shell" style={{ paddingTop: "24px" }}>
      <div
        className="ui-panel"
        style={{ textAlign: "center", padding: "40px 20px" }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--blue-bg)",
            color: "var(--blue)",
          }}
        >
          <MessageCircle size={28} />
        </div>
        <h2 className="page-title" style={{ marginBottom: "8px" }}>
          Nhắn tin - Coming Soon
        </h2>
        <p
          className="page-subtitle"
          style={{ margin: "0 auto", maxWidth: "560px" }}
        >
          Tính năng nhắn tin đang được phát triển. Bạn vui lòng quay lại sau ở
          phiên bản tiếp theo.
        </p>
      </div>
    </div>
  );
};

export default Messages;
