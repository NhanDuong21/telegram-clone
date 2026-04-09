import { useState, useRef } from "react";
import { sendMessageApi, uploadImageApi } from "../../api/chatApi";
import { getSocket } from "../../socket";
import type { Message } from "./ChatBox";

interface MessageInputProps {
    conversationId: string;
    receiverId?: string;
    onMessageSent: (message: Message) => void;
}

const MessageInput = ({ conversationId, receiverId, onMessageSent }: MessageInputProps) => {
    const [text, setText] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [sending, setSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn file ảnh hợp lệ.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("File ảnh quá lớn (tối đa 5MB).");
            return;
        }

        setIsUploading(true);
        try {
            const res = await uploadImageApi(file);
            setImageUrl(res.data.imageUrl);
        } catch (error: any) {
            console.error("Upload failed:", error);
            alert(error.response?.data?.message || "Lỗi upload ảnh.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const emitTyping = (isTyping: boolean) => {
        if (!receiverId) return;
        const socket = getSocket();
        if (socket) {
            socket.emit("typing", { receiverId, isTyping });
        }
    };

    const handleSend = async () => {
        const trimmedText = text.trim();
        const trimmedImage = imageUrl.trim();
        if ((!trimmedText && !trimmedImage) || sending) return;

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        emitTyping(false);

        setSending(true);
        try {
            const res = await sendMessageApi(conversationId, { text: trimmedText, imageUrl: trimmedImage });
            onMessageSent(res.data.message); 
            setText("");
            setImageUrl("");
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const canSend = (text.trim() || imageUrl.trim()) && !sending;

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {imageUrl && (
                <div style={{ padding: "8px 16px", backgroundColor: "#f0f2f5", borderTop: "1px solid #e8ecf0", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <img src={imageUrl} alt="preview" style={{ height: "60px", borderRadius: "8px", objectFit: "cover", border: "1px solid #ccc" }} />
                        <button
                            onClick={() => setImageUrl("")}
                            style={{
                                position: "absolute", top: "-6px", right: "-6px",
                                background: "#ff4d4f", color: "white", border: "none",
                                borderRadius: "50%", width: "20px", height: "20px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", fontSize: "10px", fontWeight: "bold",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                            }}
                            title="Xóa ảnh đính kèm"
                        >✕</button>
                    </div>
                </div>
            )}
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
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{
                        padding: "8px",
                        background: "transparent",
                        border: "none",
                        borderRadius: "50%",
                        cursor: isUploading ? "not-allowed" : "pointer",
                        fontSize: "18px",
                        marginBottom: "4px",
                        flexShrink: 0,
                        opacity: isUploading ? 0.6 : 1,
                    }}
                    title="Upload ảnh"
                >
                    {isUploading ? (
                        <div style={{ width: "20px", height: "20px", border: "2px solid rgba(0,136,204,0.3)", borderTopColor: "#0088cc", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}>
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                    )}
                </button>
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
        </div>
    );
};

export default MessageInput;
