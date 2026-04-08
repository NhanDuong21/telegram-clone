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

    return (
        <div
            style={{
                display: "flex",
                gap: "8px",
                padding: "10px 12px",
                borderTop: "1px solid #eee",
                backgroundColor: "white",
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
                    padding: "8px 12px",
                    borderRadius: "20px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    resize: "none",
                    outline: "none",
                    fontFamily: "inherit",
                    maxHeight: "100px",
                    overflowY: "auto",
                    lineHeight: "1.4",
                }}
            />
            <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                style={{
                    padding: "8px 18px",
                    borderRadius: "20px",
                    border: "none",
                    backgroundColor: text.trim() && !sending ? "#0088cc" : "#ccc",
                    color: "white",
                    cursor: text.trim() && !sending ? "pointer" : "not-allowed",
                    fontSize: "14px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                }}
            >
                {sending ? "..." : "Gửi"}
            </button>
        </div>
    );
};

export default MessageInput;
