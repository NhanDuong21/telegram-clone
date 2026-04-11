import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { sendMessageApi } from "../../../api/chatApi";
import { getSocket } from "../../../socket";
import type { Message } from "../../../types";
import { SOCKET_EVENTS } from "../../../constants/socketEvents";
import './MessageInput.css';

interface MessageInputProps {
    conversationId: string;
    onMessageSent: (message: Message) => void;
}

const MessageInput = ({ conversationId, onMessageSent }: MessageInputProps) => {
    const [text, setText] = useState("");
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

        setIsUploading(true);
        try {
            // 1. Nén ảnh (Giảm xuống dưới 500KB)
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1280,
                useWebWorker: true
            };
            const compressedFile = await imageCompression(file, options);

            // 2. Upload trực tiếp lên Cloudinary (Bypass Server)
            const formData = new FormData();
            formData.append("file", compressedFile);
            formData.append("upload_preset", "ml_default"); // User needs to create an 'Unsigned' preset
            formData.append("cloud_name", "dqc4hufot");

            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/dqc4hufot/image/upload`;
            const response = await fetch(cloudinaryUrl, {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Cloudinary upload failed");
            const data = await response.json();
            const uploadedImageUrl = data.secure_url;

            // 3. Gửi tin nhắn kèm URL ảnh đã upload
            const sendRes = await sendMessageApi(conversationId, { text: "", imageUrl: uploadedImageUrl });
            onMessageSent(sendRes.data.message);
        } catch (error: unknown) {
            console.error("Upload and send failed:", error);
            alert("Lỗi upload ảnh. Vui lòng kiểm tra lại cấu hình Unsigned Upload Preset trên Cloudinary.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const emitTyping = (isTyping: boolean) => {
        if (!conversationId) return;
        const socket = getSocket();
        if (socket) {
            socket.emit(SOCKET_EVENTS.TYPING, { conversationId, isTyping });
        }
    };

    const handleSend = async () => {
        const trimmedText = text.trim();
        if (!trimmedText || sending) return;

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        emitTyping(false);

        setSending(true);
        try {
            const res = await sendMessageApi(conversationId, { text: trimmedText, imageUrl: "" });
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const canSend = text.trim() && !sending;

    return (
        <div className="message-input-container">
            <div className="message-input-wrapper">
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
                    className={`file-upload-btn ${isUploading ? "file-upload-btn--loading" : ""}`}
                    title="Upload ảnh"
                >
                    {isUploading ? (
                        <div className="upload-spinner" />
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}>
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                    )}
                </button>
                <div className="text-input-container">
                    <textarea
                        rows={1}
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập tin nhắn..."
                        className="message-textarea"
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={`send-btn ${canSend ? "send-btn--active" : ""}`}
                >
                    {sending ? "..." : "Gửi"}
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
