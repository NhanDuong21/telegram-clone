import { memo } from "react";
import { motion } from "framer-motion";
import { CornerUpRight, Pin, Clock, Check, CheckCheck } from "lucide-react";
import type { Message } from "../../../types";
import HighlightText from "./HighlightText";
import ImageAlbum from "./ImageAlbum";
import VideoMessage from "./VideoMessage";
import MediaMetaOverlay from "./MediaMetaOverlay";
import "./MessageItem.css";

interface MessageItemProps {
    msg: Message;
    isMe: boolean;
    isRead: boolean;
    isGroupConversation: boolean;
    isFirst: boolean;
    isLast: boolean;
    showAvatar: boolean;
    currentUserId: string;
    searchQuery: string;
    onImagePreview?: (url: string, messageId?: string, senderId?: string) => void;
    onContextMenu: (e: React.MouseEvent, msg: Message) => void;
    onTouchStart: (e: React.TouchEvent, msg: Message) => void;
    onTouchEnd: () => void;
    onReplySnippetClick: (targetId: string) => void;
    uploadProgress?: Record<string, number>;
    reactions?: any[];
}

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const MessageItem = ({
    msg, isMe, isRead, isGroupConversation, isFirst, isLast, showAvatar,
    searchQuery, onImagePreview, onContextMenu, onTouchStart, onTouchEnd,
    onReplySnippetClick, uploadProgress, reactions = []
}: MessageItemProps) => {
    const senderObj = msg.sender as any;
    const isMediaMessage = (msg.type === 'image' || msg.type === 'video' || (msg.imageUrls && msg.imageUrls.length > 0)) && !msg.isDeleted;
    const isPureMedia = isMediaMessage && !msg.text;

    const renderReplySnippet = (replyTo: any) => {
        if (!replyTo) return null;
        return (
            <div 
                className="message-reply-snippet"
                onClick={() => onReplySnippetClick(replyTo._id)}
            >
                <div className="reply-sender">{replyTo.sender.fullName || replyTo.sender.username}</div>
                <div className="reply-text">
                    {replyTo.text || (replyTo.imageUrl ? "📷 Ảnh" : "Tin nhắn")}
                </div>
            </div>
        );
    };

    const renderReactions = (reacts: any[]) => {
        if (!reacts || reacts.length === 0) return null;
        
        const counts: Record<string, number> = {};
        reacts.forEach(r => counts[r.emoji] = (counts[r.emoji] || 0) + 1);

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

    const messageVariants = {
        initial: { opacity: 0, scale: 0.9, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.1 } }
    };

    return (
        <motion.div
            layout
            variants={messageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`message-row ${isMe ? "message-row--me" : "message-row--other"} ${isLast ? "message-row--group-last" : ""} ${isFirst ? "message-row--group-first" : ""}`}
        >
            {!isMe && (
                <div className="message-avatar" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                    {senderObj?.avatar ? (
                        <img 
                            src={senderObj.avatar} 
                            alt={senderObj.username || "Avatar"} 
                            className="message-avatar-img"
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
                className={`message-bubble ${isMe ? "message-bubble--me" : "message-bubble--other"} ${msg.isDeleted ? "message-bubble--deleted" : ""} ${msg.isPinned ? "message-bubble--pinned" : ""} ${isMediaMessage ? "message-bubble--media" : ""} ${isPureMedia ? "message-bubble--pure-media" : ""} ${!isLast ? "message-bubble--group-middle" : ""} ${isLast ? "has-tail" : ""}`}
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

                {!isMe && isGroupConversation && isFirst && (
                    <div className="message-sender">
                        {senderObj?.fullName || senderObj?.username}
                    </div>
                )}

                {renderReplySnippet(msg.replyTo)}
                
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
                        onContextMenu={(e, _url) => onContextMenu(e, msg)}
                    />
                ) : msg.imageUrl && !msg.isDeleted && (
                    <div className="single-image-container">
                        <img
                            src={msg.imageUrl}
                            alt="Attached"
                            className={`message-image ${isMe ? "message-image--me" : "message-image--other"} ${msg.text ? "message-image--with-text" : ""}`}
                            onClick={() => onImagePreview?.(msg.imageUrl!, msg._id, (msg.sender as any)._id || msg.sender)}
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
                        <div className="bubble-content">
                            <span className="message-text">
                                {msg.isDeleted ? (
                                    "Tin nhắn đã bị xóa"
                                ) : (
                                    <HighlightText text={msg.text} highlight={searchQuery} />
                                )}
                            </span>
                            
                            {!isPureMedia && (
                                <div className="metadata-container">
                                    {msg.isPinned && <Pin size={10} className="pin-hint-icon" />}
                                    {msg.isEdited && <span className="edited-hint">đã sửa</span>}
                                    <span className="time">{formatTime(msg.createdAt)}</span>
                                    {isMe && !msg.isDeleted && (
                                        <span className="status">
                                            {msg.isSending ? (
                                                <Clock size={11} className="status-icon--sending" />
                                            ) : isRead ? (
                                                <CheckCheck size={13} className="tick-read" />
                                            ) : (
                                                <Check size={13} className="tick-sent" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {renderReactions(reactions)}
            </div>
        </motion.div>
    );
};

export default memo(MessageItem);
