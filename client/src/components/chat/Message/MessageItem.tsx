import { memo } from "react";
import { motion } from "framer-motion";
import { CornerUpRight, Pin, Clock, Check, CheckCheck } from "lucide-react";
import type { Message } from "../../../types";
import HighlightText from "./HighlightText";
import ImageAlbum from "./ImageAlbum";
import VideoMessage from "./VideoMessage";
import MediaMetaOverlay from "./MediaMetaOverlay";
import Avatar from "../../common/Avatar";
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
    onMediaLoad?: () => void;
}

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Telegram-style sender name colors — deterministic from userId
const SENDER_COLORS = [
    '#c03d33', // red
    '#4fad2d', // green
    '#d09306', // orange
    '#168acd', // blue
    '#8544d6', // purple
    '#cd4073', // pink
    '#2996ad', // teal
    '#ce671b', // burnt orange
];

const getSenderColor = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
};

const MessageItem = ({
    msg, isMe, isRead, isGroupConversation, isFirst, isLast, showAvatar,
    searchQuery, onImagePreview, onContextMenu, onTouchStart, onTouchEnd,
    onReplySnippetClick, uploadProgress, reactions = [], onMediaLoad
}: MessageItemProps) => {
    const senderObj = msg.sender as any;
    const isMediaMessage = (msg.type === 'image' || msg.type === 'video' || (msg.imageUrls && msg.imageUrls.length > 0)) && !msg.isDeleted;
    const isPureMedia = isMediaMessage && !msg.text;

    const mediaItems: { id: string; type: 'image' | 'video'; url: string }[] = [];
    if (!msg.isDeleted) {
        if (msg.videoUrl) mediaItems.push({ id: `vid-${msg.videoUrl}`, type: 'video', url: msg.videoUrl });
        if (msg.imageUrls && msg.imageUrls.length > 0) {
            msg.imageUrls.forEach((url, i) => mediaItems.push({ id: `img-${i}-${url}`, type: 'image', url }));
        } else if (msg.imageUrl) {
            mediaItems.push({ id: `img-${msg.imageUrl}`, type: 'image', url: msg.imageUrl });
        }
    }

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
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: { duration: 0.1 } }
    };

    return (
        <motion.div
            variants={messageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`message-row ${isMe ? "message-row--me" : "message-row--other"} ${isLast ? "message-row--group-last" : ""} ${isFirst ? "message-row--group-first" : ""}`}
        >
            {!isMe && (
                <div className="avatar-wrapper">
                    {showAvatar && (
                        <motion.div 
                            layoutId={`avatar-${senderObj?._id || senderObj}`}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                            }}
                            className="message-avatar"
                        >
                            <Avatar user={senderObj} size={36} />
                        </motion.div>
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
                    <div className="flex items-center gap-1.5 px-3 pt-1.5 text-[12px] font-medium text-blue-600 dark:text-sky-400">
                        <CornerUpRight size={13} strokeWidth={2.5} />
                        <span>Chuyển tiếp từ <b>{msg.forwardFrom.fullName || msg.forwardFrom.username}</b></span>
                    </div>
                )}

                {!isMe && isGroupConversation && isFirst && (
                    <div 
                        className="message-sender"
                        style={{ color: getSenderColor(senderObj?._id || '') }}
                    >
                        {senderObj?.fullName || senderObj?.username}
                    </div>
                )}

                {renderReplySnippet(msg.replyTo)}
                
                <div className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {mediaItems.length === 1 && mediaItems[0].type === 'video' && !msg.isDeleted && (
                        <VideoMessage 
                            videoUrl={mediaItems[0].url} 
                            videoWidth={msg.videoWidth}
                            videoHeight={msg.videoHeight}
                            createdAt={msg.createdAt}
                            isSending={msg.isSending}
                            isError={msg.isError}
                            isMe={isMe}
                            isRead={isRead}
                            progress={uploadProgress?.[msg.tempId || msg._id]}
                            onVideoClick={(url) => onImagePreview?.(url, msg._id, (msg.sender as any)._id || msg.sender)}
                            onMediaLoad={onMediaLoad}
                        />
                    )}

                    {mediaItems.length === 1 && mediaItems[0].type === 'image' && !msg.isDeleted && (
                        <div className="single-image-container w-fit">
                            <img
                                src={mediaItems[0].url}
                                alt="Attached"
                                loading="lazy"
                                className={`message-image ${isMe ? "message-image--me" : "message-image--other"} ${msg.text ? "message-image--with-text" : ""}`}
                                onClick={() => onImagePreview?.(mediaItems[0].url, msg._id, (msg.sender as any)._id || msg.sender)}
                                onLoad={onMediaLoad}
                            />
                            <MediaMetaOverlay 
                                createdAt={msg.createdAt} 
                                isMe={isMe} 
                                isSending={msg.isSending} 
                                isRead={isRead} 
                            />
                        </div>
                    )}

                    {mediaItems.length > 1 && !msg.isDeleted && (
                        <ImageAlbum 
                            mediaItems={mediaItems} 
                            isSending={msg.isSending}
                            isError={msg.isError}
                            isMe={isMe}
                            isRead={isRead}
                            createdAt={msg.createdAt}
                            progress={uploadProgress?.[msg.tempId || msg._id]}
                            onMediaClick={(url) => onImagePreview?.(url, msg._id, (msg.sender as any)._id || msg.sender)} 
                            onContextMenu={(e, _url) => onContextMenu(e, msg)}
                            onMediaLoad={onMediaLoad}
                        />
                    )}
                </div>
                
                {msg.text && (
                    <div className={`message-text-content ${msg.isDeleted ? "message-text--deleted" : ""}`}>
                        <div className="bubble-content">
                            <span className="message-text">
                                {msg.isDeleted ? (
                                    "Tin nhắn đã bị xóa"
                                ) : (
                                    <HighlightText text={msg.text} highlight={searchQuery} />
                                )}
                                <span className="metadata-spacer"></span>
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
