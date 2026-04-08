import { useState, useRef } from "react";
import { sendMessageApi } from "../../api/chatApi";
import { getSocket } from "../../socket";
import type { Message } from "./ChatBox";

interface MessageInputProps {
    conversationId: string;
    receiverId?: string;
    onMessageSent: (message: Message) => void;
}

const MessageInput = ({ conversationId, receiverId, onMessageSent }: MessageInputProps) => {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const emitTyping = (isTyping: boolean) => {
        if (!receiverId) return;
        const socket = getSocket();
        if (socket) {
            socket.emit("typing", { receiverId, isTyping });
        }
    };

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        emitTyping(false);

        setSending(true);
        try {
            const res = await sendMessageApi(conversationId, trimmed);
            onMessageSent(res.data.message); 
            setText("");
        } catch (error) {
            console.error("Send message failed:", error);
        } finally {
            setSending(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        emitTyping(true);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            emitTyping(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const canSend = text.trim() && !sending;

    return (
        <div
            style={{
                display: "flex",
                gap: "10px",
                padding: "12px 16px",
                borderTop: "1px solid #e8ecf0",
                backgroundColor: "#ffffff",
                alignItems: "flex-end",
            }}
        >
            <textarea
                rows={1}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn... (Enter để gửi)"
                style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "22px",
                    border: "1px solid #dce1e6",
                    fontSize: "14px",
                    resize: "none",
                    outline: "none",
                    fontFamily: "inherit",
                    maxHeight: "100px",
                    overflowY: "auto",
                    lineHeight: "1.5",
                    backgroundColor: "#f7f9fb",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0088cc";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,136,204,0.12)";
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#dce1e6";
                    e.currentTarget.style.boxShadow = "none";
                }}
            />
            <button
                onClick={handleSend}
                disabled={!canSend}
                style={{
                    padding: "10px 20px",
                    borderRadius: "22px",
                    border: "none",
                    background: canSend
                        ? "linear-gradient(135deg, #0088cc, #0077b5)"
                        : "#dce1e6",
                    color: "white",
                    cursor: canSend ? "pointer" : "not-allowed",
                    fontSize: "14px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "background 0.2s, transform 0.1s",
                    boxShadow: canSend
                        ? "0 2px 6px rgba(0,136,204,0.3)"
                        : "none",
                }}
            >
                {sending ? "..." : "Gửi"}
            </button>
        </div>
    );
};

export default MessageInput;
