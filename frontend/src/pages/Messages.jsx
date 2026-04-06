import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axios-client";
import { AuthContext } from "../context/AuthContext";
import getApiErrorMessage from "../utils/get-api-error-message";
import { MessageCircle, Send, CheckCircle2 } from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString("vi-VN");
};

const Messages = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmingReturn, setConfirmingReturn] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const fetchConversations = useCallback(async () => {
    const res = await axiosClient.get("/messages/conversations");
    const rows = Array.isArray(res.data) ? res.data : [];
    setConversations(rows);

    const requestedConversationId = new URLSearchParams(location.search).get(
      "conversation",
    );

    if (
      requestedConversationId &&
      rows.some((c) => c.id === requestedConversationId)
    ) {
      setSelectedConversationId(requestedConversationId);
      return;
    }

    if (!selectedConversationId && rows.length > 0) {
      setSelectedConversationId(rows[0].id);
    }
  }, [location.search, selectedConversationId]);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    const res = await axiosClient.get(
      `/messages/conversations/${conversationId}/messages`,
    );
    setMessages(Array.isArray(res.data) ? res.data : []);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        await fetchConversations();
      } catch (err) {
        alert(getApiErrorMessage(err, "Không thể tải tin nhắn."));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate, fetchConversations]);

  useEffect(() => {
    if (!selectedConversationId) return;
    fetchMessages(selectedConversationId).catch((err) => {
      alert(getApiErrorMessage(err, "Không thể tải cuộc trò chuyện."));
    });
  }, [selectedConversationId, fetchMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedConversationId || !draft.trim()) return;

    setSending(true);
    try {
      await axiosClient.post(
        `/messages/conversations/${selectedConversationId}/messages`,
        {
          body: draft.trim(),
        },
      );
      setDraft("");
      await fetchMessages(selectedConversationId);
      await fetchConversations();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không thể gửi tin nhắn."));
    } finally {
      setSending(false);
    }
  };

  const handleConfirmReturn = async () => {
    const claimId = selectedConversation?.claim?.id;
    if (!claimId) return;

    setConfirmingReturn(true);
    try {
      const res = await axiosClient.post(`/claims/${claimId}/confirm-return`);
      alert(res.data?.message || "Đã ghi nhận xác nhận hoàn trả.");
      await fetchConversations();
      await fetchMessages(selectedConversationId);
    } catch (err) {
      alert(getApiErrorMessage(err, "Không thể xác nhận hoàn trả."));
    } finally {
      setConfirmingReturn(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container page-shell" style={{ paddingTop: "24px" }}>
      <div
        className="messages-layout"
        style={{
          display: "grid",
          gap: "16px",
        }}
      >
        <div className="ui-panel messages-sidebar" style={{ padding: "0" }}>
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <MessageCircle size={18} /> Hộp thư trao đổi
          </div>

          {loading ? (
            <div style={{ padding: "16px", color: "var(--muted)" }}>
              Đang tải...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "16px", color: "var(--muted)" }}>
              Chưa có cuộc trò chuyện nào.
            </div>
          ) : (
            <div
              className="messages-list"
              style={{ maxHeight: "65vh", overflowY: "auto" }}
            >
              {conversations.map((conv) => {
                const others = (conv.participants || []).filter(
                  (p) => !p.is_me,
                );
                const displayName =
                  others.map((p) => p.full_name || p.username).join(", ") ||
                  "Cuộc trò chuyện";
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      background:
                        conv.id === selectedConversationId
                          ? "var(--surface)"
                          : "transparent",
                      padding: "12px 14px",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--ink)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {displayName}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                      {conv.item?.title || "Không rõ vật phẩm"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--muted)",
                        marginTop: "2px",
                      }}
                    >
                      {conv.last_message?.is_system
                        ? `[Hệ thống] ${conv.last_message?.body || ""}`
                        : conv.last_message?.body || "Chưa có tin nhắn"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="ui-panel messages-thread"
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "65vh",
          }}
        >
          {!selectedConversation ? (
            <div style={{ color: "var(--muted)", margin: "auto" }}>
              Chọn một cuộc trò chuyện để bắt đầu.
            </div>
          ) : (
            <>
              <div
                style={{
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "10px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontWeight: 800, color: "var(--ink)" }}>
                  {selectedConversation.item?.title || "Vật phẩm"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {(selectedConversation.participants || [])
                    .filter((p) => !p.is_me)
                    .map(
                      (p) =>
                        `${p.full_name || p.username} · ${p.profile_label}`,
                    )
                    .join(" | ")}
                </div>

                {selectedConversation.claim &&
                  ["CONNECTED"].includes(selectedConversation.claim.status) && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={handleConfirmReturn}
                      disabled={confirmingReturn}
                      style={{ marginTop: "8px" }}
                    >
                      <CheckCircle2 size={14} />
                      {confirmingReturn
                        ? "Đang xác nhận..."
                        : "Xác nhận đã hoàn trả"}
                    </button>
                  )}
              </div>

              <div
                className="messages-thread-body"
                style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}
              >
                {messages.map((m) => {
                  if (m.is_system) {
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "82%",
                            padding: "7px 10px",
                            borderRadius: "999px",
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--muted)",
                            fontSize: "0.8rem",
                            textAlign: "center",
                          }}
                        >
                          <strong>{m.system_label || "Hệ thống"}:</strong>{" "}
                          {m.body}
                        </div>
                      </div>
                    );
                  }

                  const mine = m.sender?.id === user.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "72%",
                          padding: "8px 10px",
                          borderRadius: "12px",
                          background: mine ? "var(--blue)" : "var(--surface)",
                          color: mine ? "#fff" : "var(--ink)",
                        }}
                      >
                        {!mine && (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              opacity: 0.8,
                              marginBottom: "2px",
                            }}
                          >
                            {m.sender?.full_name || m.sender?.username} ·{" "}
                            {m.sender?.profile_label}
                          </div>
                        )}
                        <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            opacity: 0.75,
                            marginTop: "4px",
                          }}
                        >
                          {formatDateTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSend}
                style={{ marginTop: "12px", display: "flex", gap: "8px" }}
              >
                <input
                  className="input"
                  placeholder="Nhập tin nhắn..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={sending}
                >
                  <Send size={14} />
                  {sending ? "Gửi..." : "Gửi"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
