import { useEffect, useRef } from "react";

import type { Message } from "../../types/chat";

interface ChatBoxProps {
    messages: Message[];
    currentUserId: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
    isGroup?: boolean;
}

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatBox = ({ messages, currentUserId, onLoadMore, hasMore, loadingMore, isGroup }: ChatBoxProps) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastMessageId = useRef<string | null>(null);

    const prevConvId = useRef<string | null>(null);

    useEffect(() => {
        if (messages.length === 0) {
            lastMessageId.current = null;
            return;
        }

        const currentConvId = messages[0].conversationId;
        const isSwitch = prevConvId.current !== currentConvId;
        if (isSwitch) {
            prevConvId.current = currentConvId;
        }

        const currentLastMessage = messages[messages.length - 1];
        if (currentLastMessage._id !== lastMessageId.current) {
            bottomRef.current?.scrollIntoView({ behavior: isSwitch ? "auto" : "smooth" });
            lastMessageId.current = currentLastMessage._id;
        }
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#b0b8c1",
                    fontSize: "15px",
                    gap: "6px",
                    background: "#f7f9fb",
                }}
            >
                <span style={{ fontSize: "32px" }}>👋</span>
                Chưa có tin nhắn nào. Hãy nói lời chào!
            </div>
        );
    }

    return (
        <div
            style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                background: "#f7f9fb",
            }}
        >
            {hasMore && (
                <div style={{ textAlign: "center", margin: "10px 0" }}>
                    <button
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        style={{
                            padding: "6px 16px",
                            borderRadius: "16px",
                            border: "none",
                            background: "#e4eef7",
                            color: "#0088cc",
                            cursor: loadingMore ? "not-allowed" : "pointer",
                            fontSize: "13px",
                            fontWeight: 600,
                            opacity: loadingMore ? 0.7 : 1,
                        }}
                    >
                        {loadingMore ? "Đang tải..." : "Tải thêm tin nhắn cũ"}
                    </button>
                </div>
            )}
            
            {messages.map((msg) => {
                const isMe = msg.sender._id === currentUserId;
                const isRead = (msg.readBy || []).some(id => id !== currentUserId);

                return (
                    <div
                        key={msg._id}
                        style={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                        }}
                    >
                        <div
                            style={{
                                maxWidth: "65%",
                                padding: "10px 14px",
                                borderRadius: isMe
                                    ? "18px 18px 4px 18px"
                                    : "18px 18px 18px 4px",
                                background: isMe
                                    ? "linear-gradient(135deg, #0088cc, #0077b5)"
                                    : "#ffffff",
                                color: isMe ? "#fff" : "#1a1a2e",
                                fontSize: "14px",
                                lineHeight: "1.5",
                                wordBreak: "break-word",
                                boxShadow: isMe
                                    ? "0 1px 4px rgba(0,136,204,0.25)"
                                    : "0 1px 3px rgba(0,0,0,0.06)",
                            }}
                        >
                            {!isMe && isGroup && (
                                <div
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: "#0088cc",
                                        marginBottom: "3px",
                                        letterSpacing: "0.2px",
                                    }}
                                >
                                    {msg.sender.username}
                                </div>
                            )}
                            
                            {msg.imageUrl && (
                                <img
                                    src={msg.imageUrl}
                                    alt="Attached image"
                                    style={{
                                        maxWidth: "100%",
                                        borderRadius: "8px",
                                        marginBottom: msg.text ? "6px" : "0",
                                        display: "block",
                                        maxHeight: "300px",
                                        objectFit: "contain",
                                        backgroundColor: isMe ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.03)"
                                    }}
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            )}
                            
                            {msg.text && <div>{msg.text}</div>}

                            <div
                                style={{
                                    fontSize: "10px",
                                    marginTop: "5px",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    alignItems: "center",
                                    gap: "4px",
                                    opacity: 0.7,
                                }}
                            >
                                <span>{formatTime(msg.createdAt)}</span>
                                {isMe && (
                                    <span style={{ color: isRead ? (isMe ? "#e0f7fa" : "#34b7f1") : "inherit", fontSize: "12px", display: "flex", alignItems: "center" }}>
                                        {isRead ? "✓✓" : "✓"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatBox;
