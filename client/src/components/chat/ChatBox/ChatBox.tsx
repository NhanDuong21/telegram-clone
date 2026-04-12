import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message, User } from "../../../types";
import { useContextMenu } from "../../../hooks/useContextMenu";
import ContextMenu from "../Message/ContextMenu";
import './ChatBox.css';

interface ChatBoxProps {
    messages: Message[];
    currentUserId: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
    isGroup?: boolean;
    onProfileClick?: (userId: string) => void;
    onImagePreview?: (url: string) => void;
    onDeleteMessage?: (msg: Message) => void;
    onReactMessage?: (msg: Message, emoji: string) => void;
}

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const messageVariants = {
    initial: { opacity: 0, scale: 0.9, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.1 } }
};

const ChatBox = ({ messages, currentUserId, onLoadMore, hasMore, loadingMore, isGroup, onProfileClick, onImagePreview, onDeleteMessage, onReactMessage }: ChatBoxProps) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastMessageId = useRef<string | null>(null);
    const prevConvId = useRef<string | null>(null);
    const { pos, targetItem, onContextMenu, onTouchStart, onTouchEnd, closeContextMenu } = useContextMenu();

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

    const renderReactions = (reactions: any[]) => {
        if (!reactions || reactions.length === 0) return null;
        
        const counts: Record<string, number> = {};
        reactions.forEach(r => counts[r.emoji] = (counts[r.emoji] || 0) + 1);

        return (
            <div className="message-reactions">
                {Object.entries(counts).map(([emoji, count]) => (
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={emoji} 
                        className="reaction-badge"
                    >
                        {emoji} {count > 1 && <span className="reaction-count">{count}</span>}
                    </motion.div>
                ))}
            </div>
        );
    };

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
            
            <AnimatePresence initial={false} mode="popLayout">
                {messages.map((msg) => {
                    const senderObj = msg.sender as unknown as User;
                    const isMe = senderObj?._id === currentUserId;
                    const isRead = msg.isRead || (msg.readBy || []).some(id => id !== currentUserId);

                    return (
                        <motion.div
                            key={msg._id}
                            variants={messageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 40,
                                opacity: { duration: 0.2 }
                            }}
                            className={`message-row ${isMe ? "message-row--me" : "message-row--other"}`}
                        >
                            {!isMe && (
                                <div 
                                    className="message-avatar"
                                    onClick={() => onProfileClick?.(senderObj?._id)}
                                >
                                    {senderObj?.avatar ? (
                                        <img 
                                            src={senderObj.avatar} 
                                            alt={senderObj.username || "Avatar"} 
                                            className="message-avatar-img"
                                            onError={(e) => {
                                                const target = e.currentTarget;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    const fallback = document.createElement('div');
                                                    fallback.className = 'message-avatar-fallback';
                                                    fallback.innerText = (msg.sender?.username || (msg as any).senderId?.username || "?").substring(0, 1).toUpperCase();
                                                    parent.appendChild(fallback);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="message-avatar-fallback">
                                            {(msg.sender?.username || (msg as any).senderId?.username || "?").substring(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div 
                                className={`message-bubble ${isMe ? "message-bubble--me" : "message-bubble--other"} ${msg.isDeleted ? "message-bubble--deleted" : ""}`}
                                onContextMenu={(e) => !msg.isDeleted && onContextMenu(e, msg)}
                                onTouchStart={(e) => !msg.isDeleted && onTouchStart(e, msg)}
                                onTouchEnd={onTouchEnd}
                            >
                                {!isMe && isGroup && (
                                    <div
                                        className="message-sender"
                                        onClick={() => onProfileClick?.(senderObj?._id)}
                                    >
                                        {senderObj?.username}
                                    </div>
                                )}
                                
                                {msg.imageUrl && !msg.isDeleted && (
                                    <img
                                        src={msg.imageUrl}
                                        alt="Attached"
                                        className={`message-image ${isMe ? "message-image--me" : "message-image--other"} ${msg.text ? "message-image--with-text" : ""}`}
                                        onClick={() => onImagePreview?.(msg.imageUrl!)}
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                )}
                                
                                {msg.text && (
                                    <div className={msg.isDeleted ? "message-text--deleted" : ""}>
                                        {msg.isDeleted ? "Tin nhắn đã bị xóa" : msg.text}
                                    </div>
                                )}

                                <div className="message-footer">
                                    <span>{formatTime(msg.createdAt)}</span>
                                    {isMe && !msg.isDeleted && (
                                        <span className={`message-status ${isRead ? "message-status--read-me" : "message-status--unread-me"}`}>
                                            {isRead ? "✓✓" : "✓"}
                                        </span>
                                    )}
                                </div>

                                {renderReactions(msg.reactions || [])}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            <AnimatePresence>
                {pos && (
                    <ContextMenu
                        x={pos.x}
                        y={pos.y}
                        isMe={(targetItem?.sender?._id || targetItem?.sender) === currentUserId}
                        text={targetItem?.text}
                        onClose={closeContextMenu}
                        onDelete={() => onDeleteMessage?.(targetItem)}
                        onReact={(emoji) => onReactMessage?.(targetItem, emoji)}
                    />
                )}
            </AnimatePresence>

            <div ref={bottomRef} />
        </div>
    );
};

export default ChatBox;
