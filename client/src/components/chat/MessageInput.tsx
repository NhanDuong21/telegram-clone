import { useState } from "react";
import { sendMessageApi } from "../../api/chatApi";
import type { Message } from "./ChatBox";

interface MessageInputProps {
    conversationId: string;
    onMessageSent: (message: Message) => void;
}

const MessageInput = ({ conversationId, onMessageSent }: MessageInputProps) => {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;

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
                onChange={(e) => setText(e.target.value)}
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
