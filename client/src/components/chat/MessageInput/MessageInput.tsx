import { useState, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { sendMessageApi, updateMessageApi } from "../../../api/chatApi";
import { getSocket } from "../../../socket";
import type { Message } from "../../../types";
import { SOCKET_EVENTS } from "../../../constants/socketEvents";
import { X, CornerUpLeft, Pencil, Paperclip, SendHorizontal } from "lucide-react";
import './MessageInput.css';

interface MessageInputProps {
    conversationId: string;
    onMessageSent: (message: Message) => void;
    replyTarget?: Message | null;
    editTarget?: Message | null;
    onCancelMode?: () => void;
}

const MessageInput = ({ conversationId, onMessageSent, replyTarget, editTarget, onCancelMode }: MessageInputProps) => {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editTarget) {
            setText(editTarget.text || "");
            textareaRef.current?.focus();
        } else if (!replyTarget) {
            setText("");
        }
    }, [editTarget, replyTarget]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn file ảnh hợp lệ.");
            return;
        }

        setIsUploading(true);
        try {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1280,
                useWebWorker: true
            };
            const compressedFile = await imageCompression(file, options);

            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dqc4hufot";
            const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";

            const formData = new FormData();
            formData.append("file", compressedFile);
            formData.append("upload_preset", uploadPreset);
            formData.append("cloud_name", cloudName);

            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
            const response = await fetch(cloudinaryUrl, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData?.error?.message || "Cloudinary upload failed");
            }

            const data = await response.json();
            const uploadedImageUrl = data.secure_url;

            const sendRes = await sendMessageApi(conversationId, { 
                text: "", 
                imageUrl: uploadedImageUrl,
                replyTo: replyTarget?._id
            });
            onMessageSent(sendRes.data.message);
            if (replyTarget) onCancelMode?.();
        } catch (error: any) {
            console.error("Upload and send failed:", error);
            alert(`Lỗi: ${error?.message || "Không thể upload ảnh"}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const emitTyping = (isTyping: boolean) => {
        if (!conversationId) return;
        const socket = getSocket();
        if (socket) {
            const event = isTyping ? SOCKET_EVENTS.TYPING : SOCKET_EVENTS.STOP_TYPING;
            socket.emit(event, { conversationId });
        }
    };

    const handleSend = async () => {
        const trimmedText = text.trim();
        if (!trimmedText || sending) return;

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        emitTyping(false);

        setSending(true);
        const tempId = `temp-${Date.now()}`;
        const tempMsg: any = {
            _id: tempId,
            conversationId,
            text: trimmedText,
            sender: { _id: (window as any).currentUser?._id || "", username: "Bạn" },
            isSending: true,
            createdAt: new Date().toISOString(),
            readBy: [],
            isRead: false,
            reactions: []
        };

        if (replyTarget) {
            tempMsg.replyTo = replyTarget;
        }

        // Optimistically add to UI
        if (!editTarget) {
            onMessageSent(tempMsg);
        }

        try {
            if (editTarget) {
                const res = await updateMessageApi(editTarget._id, { text: trimmedText });
                onMessageSent(res.data.updatedMessage);
                onCancelMode?.();
            } else {
                const res = await sendMessageApi(conversationId, { 
                    text: trimmedText, 
                    imageUrl: "",
                    replyTo: replyTarget?._id
                });
                // Replace temp with real (handled by _id in setMessages usually)
                onMessageSent({ ...res.data.message, tempId }); 
                if (replyTarget) onCancelMode?.();
            }
            setText("");
        } catch (error) {
            console.error("Send/Edit message failed:", error);
            // Optionally remove temp message here
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
        } else if (e.key === "Escape") {
            onCancelMode?.();
        }
    };

    const canSend = text.trim() && !sending;

    return (
        <div className="message-input-container">
            {(replyTarget || editTarget) && (
                <div className="message-input-mode-preview">
                    <div className="mode-preview-icon">
                        {replyTarget ? <CornerUpLeft size={18} /> : <Pencil size={18} />}
                    </div>
                    <div className="mode-preview-content">
                        <div className="mode-preview-title">
                            {replyTarget ? `Đang trả lời ${replyTarget.sender.username}` : "Sửa tin nhắn"}
                        </div>
                        <div className="mode-preview-text">
                            {replyTarget ? (replyTarget.text || "Hình ảnh") : editTarget?.text}
                        </div>
                    </div>
                    <button className="mode-preview-close" onClick={onCancelMode}>
                        <X size={18} />
                    </button>
                </div>
            )}
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
                        <Paperclip size={20} />
                    )}
                </button>
                <div className="text-input-container">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                            emitTyping(false);
                        }}
                        placeholder="Nhập tin nhắn..."
                        className="message-textarea"
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={`send-btn ${canSend ? "send-btn--active" : ""}`}
                >
                    {sending ? "..." : <SendHorizontal size={20} />}
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
