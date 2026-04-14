import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { sendMessageApi, updateMessageApi } from "../../../api/chatApi";
import { getSocket } from "../../../socket";
import type { Message, Conversation } from "../../../types";
import { SOCKET_EVENTS } from "../../../constants/socketEvents";
import { X, CornerUpLeft, Pencil, Paperclip, SendHorizontal } from "lucide-react";
import SendImageModal from "../Modals/SendImageModal";
import './MessageInput.css';

interface MessageInputProps {
    conversationId: string;
    onMessageSent: (message: Message) => void;
    replyTarget?: Message | null;
    editTarget?: Message | null;
    onCancelMode?: () => void;
    isTemporary?: boolean;
    otherUserId?: string;
    onConversationCreated?: (conv: Conversation) => void;
}

const MessageInput = ({ 
    conversationId, 
    onMessageSent, 
    replyTarget, 
    editTarget, 
    onCancelMode, 
    isTemporary, 
    otherUserId,
    onConversationCreated 
}: MessageInputProps) => {
    const { user } = useAuth();
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingImages, setPendingImages] = useState<File[]>([]);
    
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        
        const imageFiles = files.filter(f => f.type.startsWith("image/"));
        if (imageFiles.length === 0) {
            alert("Vui lòng chọn file ảnh hợp lệ.");
            return;
        }

        setPendingImages(prev => [...prev, ...imageFiles]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
                const file = items[i].getAsFile();
                if (file) files.push(file);
            }
        }

        if (files.length > 0) {
            e.preventDefault();
            setPendingImages(prev => [...prev, ...files]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        const imageFiles = files.filter(f => f.type.startsWith("image/"));
        
        if (imageFiles.length > 0) {
            setPendingImages(prev => [...prev, ...imageFiles]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleSendImages = async (caption: string, files: File[]) => {
        if (files.length === 0 || isUploading) return;
        
        setIsUploading(true);
        setPendingImages([]); // Close modal

        try {
            const formData = new FormData();
            formData.append("text", caption);
            if (replyTarget) formData.append("replyTo", replyTarget._id);
            formData.append("type", "image");

            // Option A: Upload each file to Cloudinary from client (parallel)
            // Option B: Multi-part upload to backend
            // User requested FormData with File objects -> Option B
            
            files.forEach(file => {
                formData.append("images", file);
            });

            const res = await sendMessageApi(conversationId, formData);
            onMessageSent(res.data.message);
            if (replyTarget) onCancelMode?.();
        } catch (error: any) {
            console.error("Upload and send multiple images failed:", error);
            alert(`Lỗi: ${error?.message || "Không thể gửi ảnh"}`);
        } finally {
            setIsUploading(false);
        }
    };

    const emitTyping = (isTyping: boolean) => {
        if (!conversationId || conversationId.startsWith("temp_")) return;
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
            sender: { _id: user?._id || "", username: user?.username || "Bạn" },
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
                let actualId = conversationId;
                if (isTemporary && otherUserId) {
                    try {
                        const { createOrGetConversationApi } = await import("../../../api/chatApi");
                        const resConv = await createOrGetConversationApi(otherUserId);
                        const newConv = resConv.data.conversation;
                        actualId = newConv._id;
                        if (onConversationCreated) onConversationCreated(newConv);
                    } catch (err) {
                        console.error("Failed to create conversation:", err);
                        throw new Error("Không thể khởi tạo cuộc trò chuyện");
                    }
                }

                const res = await sendMessageApi(actualId, { 
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
        <div 
            className="message-input-container"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
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
                    multiple
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
                        onPaste={handlePaste}
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

            {pendingImages.length > 0 && (
                <SendImageModal 
                    files={pendingImages}
                    onClose={() => setPendingImages([])}
                    onAddMore={() => fileInputRef.current?.click()}
                    onSend={handleSendImages}
                />
            )}
        </div>
    );
};

export default MessageInput;
