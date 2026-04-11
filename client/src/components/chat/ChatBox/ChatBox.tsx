import { useEffect, useRef } from "react";
import type { Message } from "../../../types/chat";
import './ChatBox.css';

interface ChatBoxProps {
    messages: Message[];
    currentUserId: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
    isGroup?: boolean;
    onProfileClick?: (userId: string) => void;
}

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatBox = ({ messages, currentUserId, onLoadMore, hasMore, loadingMore, isGroup, onProfileClick }: ChatBoxProps) => {
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
            <div className="chat-box--empty">
                <span className="chat-box__empty-icon">👋</span>
                Chưa có tin nhắn nào. Hãy nói lời chào!
            </div>
        );
    }

    return (
        <div className="chat-box">
            {hasMore && (
                <div className="chat-box__load-more">
                    <button
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        className="chat-box__load-more-btn"
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
                        className={`message-row ${isMe ? "message-row--me" : "message-row--other"}`}
                    >
                        {!isMe && (
                            <div 
                                className={`message-avatar ${!isGroup ? "message-avatar--hidden" : ""}`}
                                onClick={() => onProfileClick?.(msg.sender._id)}
                            >
                                {msg.sender.avatar ? (
                                    <img src={msg.sender.avatar} alt={msg.sender.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="message-avatar-fallback">
                                        {msg.sender.username.substring(0, 1).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className={`message-bubble ${isMe ? "message-bubble--me" : "message-bubble--other"}`}>
                            {!isMe && isGroup && (
                                <div
                                    className="message-sender"
                                    onClick={() => onProfileClick?.(msg.sender._id)}
                                >
                                    {msg.sender.username}
                                </div>
                            )}
                            
                            {msg.imageUrl && (
                                <img
                                    src={msg.imageUrl}
                                    alt="Attached"
                                    className={`message-image ${isMe ? "message-image--me" : "message-image--other"} ${msg.text ? "message-image--with-text" : ""}`}
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            )}
                            
                            {msg.text && <div>{msg.text}</div>}

                            <div className="message-footer">
                                <span>{formatTime(msg.createdAt)}</span>
                                {isMe && (
                                    <span className={`message-status ${isRead ? "message-status--read-me" : ""}`}>
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
