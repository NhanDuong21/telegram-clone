import { useEffect, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, CornerUpRight, X, Check, CheckCheck, Clock } from "lucide-react";
import type { Message } from "../../../types";
import { useContextMenu } from "../../../hooks/useContextMenu";
import { getSocket } from "../../../socket";
import { SOCKET_EVENTS } from "../../../constants/socketEvents";
import ContextMenu from "../Message/ContextMenu";
import ImageAlbum from "../Message/ImageAlbum";
import VideoMessage from "../Message/VideoMessage";
import MediaMetaOverlay from "../Message/MediaMetaOverlay";
import './ChatBox.css';

interface ChatBoxProps {
    messages: Message[];
    currentUserId: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
    isGroup?: boolean;
    onImagePreview?: (url: string, messageId?: string, senderId?: string) => void;
    onDeleteMessage?: (msg: Message, targetFileUrl?: string) => void;
    onReactMessage?: (msg: Message, emoji: string) => void;
    onReplyMessage?: (msg: Message) => void;
    onEditMessage?: (msg: Message) => void;
    onPinMessage?: (msg: Message) => void;
    onForwardMessage?: (msg: Message) => void;
    onUnpinMessage?: (msg: Message) => void;
    uploadProgress?: Record<string, number>;
    searchQuery?: string;
    conversationId?: string;
}

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight || !highlight.trim()) return <>{text}</>;
    
    // Escape special characters for regex
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);
    
    return (
        <>
            {parts.map((part, i) => 
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="highlight-text">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const messageVariants = {
    initial: { opacity: 0, scale: 0.9, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.1 } }
};

const ChatBox = ({ 
    messages, currentUserId, onLoadMore, hasMore, loadingMore, isGroup, 
    onImagePreview, onDeleteMessage, onReactMessage,
    onReplyMessage, onEditMessage, onPinMessage, onForwardMessage, onUnpinMessage,
    uploadProgress,
    searchQuery = "",
    conversationId,
}: ChatBoxProps) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastMessageId = useRef<string | null>(null);
    const prevConvId = useRef<string | null>(null);
    const { pos, targetItem, targetFileUrl, onContextMenu, onTouchStart, onTouchEnd, closeContextMenu } = useContextMenu();

    const pinnedMessages = useMemo(() => 
        messages.filter(m => m.isPinned || m.pinnedFor?.includes(currentUserId)), 
    [messages, currentUserId]);
    const latestPinned = pinnedMessages[pinnedMessages.length - 1];

    useEffect(() => {
        if (!currentUserId || !conversationId || messages.length === 0) return;
        
        const lastMsg = messages[messages.length - 1];
        // String conversion for safe comparison
        if (String(lastMsg.sender._id) !== String(currentUserId) && !lastMsg.isRead) {
            console.log("📤 SOCKET EMITTED: mark_as_read for chat:", conversationId);
            const socket = getSocket();
            if (socket) {
                socket.emit(SOCKET_EVENTS.MARK_AS_READ, { 
                    conversationId, 
                    userId: currentUserId 
                });
            }
        }
    }, [messages.length, conversationId, currentUserId]);

    const scrollToMessage = (targetId: string) => {
        const element = document.getElementById(`msg-${targetId}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("highlight-target");
            setTimeout(() => {
                element.classList.remove("highlight-target");
            }, 2000);
        } else {
            console.warn(`Message with ID ${targetId} not found in DOM`);
        }
    };

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

    const renderReplySnippet = (msg: Message) => {
        if (!msg.replyTo) return null;
        
        return (
            <div 
                className="message-reply-snippet"
                onClick={() => scrollToMessage(msg.replyTo!._id)}
            >
                <div className="reply-sender">{msg.replyTo.sender.fullName || msg.replyTo.sender.username}</div>
                <div className="reply-text">
                    {msg.replyTo.text || (msg.replyTo.imageUrl ? "📷 Ảnh" : "Tin nhắn")}
                </div>
            </div>
        );
    };

    return (
        <div className="chat-box-area">
            <AnimatePresence initial={false}>
                {latestPinned && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="pinned-messages-bar"
                        style={{ overflow: 'hidden' }}
                        onClick={() => scrollToMessage(latestPinned._id)}
                    >
                        <div className="pinned-bar-main">
                            <Pin size={16} className="pinned-bar-icon" />
                            <div className="pinned-bar-content">
                                <div className="pinned-bar-title">Tin nhắn đã ghim</div>
                                <div className="pinned-bar-text">{latestPinned.text || "Hình ảnh"}</div>
                            </div>
                        </div>
                        <button 
                            className="pinned-bar-unpin"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUnpinMessage?.(latestPinned);
                            }}
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="chat-box">
                {messages.length === 0 && (
                    <div className="chat-box--empty">
                        <span className="chat-box__empty-icon">👋</span>
                        Chưa có tin nhắn nào. Hãy nói lời chào!
                    </div>
                )}
                {hasMore && messages.length > 0 && (
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
                    {messages.map((msg, index) => {
                        const isMe = (msg.sender as any)._id === currentUserId;
                        const isRead = (msg.readBy || []).some((r: any) => r._id !== currentUserId) || msg.isRead;
                        const senderObj = msg.sender as any;
                        const isMediaMessage = (msg.type === 'image' || msg.type === 'video' || (msg.imageUrls && msg.imageUrls.length > 0)) && !msg.isDeleted;
                        const isPureMedia = isMediaMessage && !msg.text;

                        const nextMsg = messages[index + 1];
                        const isLastInGroup = !nextMsg || (nextMsg.sender as any)?._id !== senderObj?._id || nextMsg.type === 'system';
                        const showAvatar = !isMe && isLastInGroup;

                        if (msg.type === 'system') {
                            return (
                                <motion.div
                                    key={msg._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="system-message-container"
                                >
                                    <span>{msg.text}</span>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div
                                key={msg._id}
                                layout
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
                                className={`message-row ${isMe ? "message-row--me" : "message-row--other"} ${isLastInGroup ? "message-row--group-last" : ""}`}
                            >
                                {!isMe && (
                                    <div className="message-avatar" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
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
                                                        const name = senderObj?.fullName || senderObj?.username || "?";
                                                        fallback.innerText = name.substring(0, 1).toUpperCase();
                                                        parent.appendChild(fallback);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="message-avatar-fallback">
                                                {(senderObj?.fullName || senderObj?.username || "?").substring(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div 
                                    id={`msg-${msg._id}`}
                                    className={`message-bubble ${isMe ? "message-bubble--me" : "message-bubble--other"} ${msg.isDeleted ? "message-bubble--deleted" : ""} ${msg.isPinned || msg.pinnedFor?.includes(currentUserId) ? "message-bubble--pinned" : ""} ${isMediaMessage ? "message-bubble--media" : ""} ${isPureMedia ? "message-bubble--pure-media" : ""} ${!isLastInGroup ? "message-bubble--group-middle" : ""}`}
                                    onContextMenu={(e) => !msg.isDeleted && onContextMenu(e, msg)}
                                    onTouchStart={(e) => !msg.isDeleted && onTouchStart(e, msg)}
                                    onTouchEnd={onTouchEnd}
                                >
                                    {msg.forwardFrom && (
                                        <div className="message-forwarded-info">
                                            <CornerUpRight size={12} className="forward-info-icon" />
                                            <span>Chuyển tiếp từ <b>{msg.forwardFrom.fullName || msg.forwardFrom.username}</b></span>
                                        </div>
                                    )}

                                    {!isMe && isGroup && (
                                        <div className="message-sender">
                                            {senderObj?.fullName || senderObj?.username}
                                        </div>
                                    )}

                                    {renderReplySnippet(msg)}
                                    
                                    {msg.type === 'video' && msg.videoUrl && !msg.isDeleted && (
                                        <VideoMessage 
                                            videoUrl={msg.videoUrl} 
                                            videoDuration={msg.videoDuration}
                                            videoWidth={msg.videoWidth}
                                            videoHeight={msg.videoHeight}
                                            createdAt={msg.createdAt}
                                            isSending={msg.isSending}
                                            isError={msg.isError}
                                            isMe={isMe}
                                            isRead={isRead}
                                            progress={uploadProgress?.[msg.tempId || msg._id]}
                                            onVideoClick={(url) => onImagePreview?.(url, msg._id, (msg.sender as any)._id || msg.sender)}
                                        />
                                    )}

                                    {msg.imageUrls && msg.imageUrls.length > 0 && !msg.isDeleted ? (
                                        <ImageAlbum 
                                            images={msg.imageUrls} 
                                            isSending={msg.isSending}
                                            isError={msg.isError}
                                            isMe={isMe}
                                            isRead={isRead}
                                            createdAt={msg.createdAt}
                                            progress={uploadProgress?.[msg.tempId || msg._id]}
                                            onImageClick={(url) => onImagePreview?.(url, msg._id, (msg.sender as any)._id || msg.sender)} 
                                            onContextMenu={(e, url) => onContextMenu(e, msg, url)}
                                        />
                                    ) : msg.imageUrl && !msg.isDeleted && (
                                        <div className="single-image-container">
                                            <img
                                                src={msg.imageUrl}
                                                alt="Attached"
                                                className={`message-image ${isMe ? "message-image--me" : "message-image--other"} ${msg.text ? "message-image--with-text" : ""}`}
                                                onClick={() => onImagePreview?.(msg.imageUrl!, msg._id, (msg.sender as any)._id || msg.sender)}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                }}
                                            />
                                            <MediaMetaOverlay 
                                                createdAt={msg.createdAt} 
                                                isMe={isMe} 
                                                isSending={msg.isSending} 
                                                isRead={isRead} 
                                            />
                                        </div>
                                    )}
                                    
                                    {msg.text && (
                                        <div className={`message-text-content ${msg.isDeleted ? "message-text--deleted" : ""}`}>
                                            {msg.isDeleted ? (
                                                "Tin nhắn đã bị xóa"
                                            ) : (
                                                <HighlightText text={msg.text} highlight={searchQuery} />
                                            )}
                                        </div>
                                    )}

                                    {!isPureMedia && (
                                        <div className="message-footer">
                                            <div className="footer-left">
                                                {msg.isPinned && <Pin size={10} className="pin-hint-icon" />}
                                                {msg.isEdited && <span className="edited-hint">đã sửa</span>}
                                                <span className="timestamp">{formatTime(msg.createdAt)}</span>
                                            </div>
                                            {isMe && !msg.isDeleted && (
                                                <div className="message-status-icons">
                                                    {msg.isSending ? (
                                                        <Clock size={12} className="status-icon--sending" />
                                                    ) : isRead ? (
                                                        <CheckCheck size={14} className="tick-read" />
                                                    ) : (
                                                        <Check size={14} className="tick-sent" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

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
                            isPinned={targetItem?.isPinned}
                            onClose={closeContextMenu}
                            onDelete={() => onDeleteMessage?.(targetItem, targetFileUrl || undefined)}
                            onReact={(emoji) => onReactMessage?.(targetItem, emoji)}
                            onReply={() => onReplyMessage?.(targetItem)}
                            onEdit={() => onEditMessage?.(targetItem)}
                            onPin={() => {
                                if (targetItem?.isPinned) {
                                    onUnpinMessage?.(targetItem);
                                } else {
                                    onPinMessage?.(targetItem);
                                }
                            }}
                            onForward={() => onForwardMessage?.(targetItem)}
                        />
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default memo(ChatBox);
