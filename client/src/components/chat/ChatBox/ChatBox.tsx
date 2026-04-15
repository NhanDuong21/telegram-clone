import { useEffect, useRef, useMemo, memo, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, X } from "lucide-react";
import type { Message } from "../../../types";
import { useContextMenu } from "../../../hooks/useContextMenu";
import { getSocket } from "../../../socket";
import { SOCKET_EVENTS } from "../../../constants/socketEvents";
import ContextMenu from "../Message/ContextMenu";
import MessageItem from "../Message/MessageItem";
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

// messageVariants used to be here

const ChatBox = ({ 
    messages, currentUserId, onLoadMore, hasMore, loadingMore, isGroup, 
    onImagePreview, onDeleteMessage, onReactMessage,
    onReplyMessage, onEditMessage, onPinMessage, onForwardMessage, onUnpinMessage,
    uploadProgress,
    searchQuery = "",
    conversationId,
}: ChatBoxProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastMessageId = useRef<string | null>(null);
    const prevConvId = useRef<string | null>(null);
    const prevMessagesLength = useRef<number>(0);
    const prevScrollHeight = useRef<number>(0);
    const isPrepending = useRef<boolean>(false);

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

    // --- SCROLL ANCHORING LOGIC ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Detect if we are prepending (loading history)
        const isSwitch = prevConvId.current !== conversationId;
        const msgLengthDiff = messages.length - prevMessagesLength.current;
        
        if (!isSwitch && msgLengthDiff > 0 && messages.length > 0 && prevMessagesLength.current > 0) {
            // Simple check: if we switched messages but didn't switch conversation, it's likely a prepend
            isPrepending.current = true;
        } else {
            isPrepending.current = false;
        }

        prevMessagesLength.current = messages.length;
        prevScrollHeight.current = container.scrollHeight;
    }, [messages, conversationId]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const isSwitch = prevConvId.current !== conversationId;
        
        if (isSwitch) {
            // Reset for new conversation
            container.scrollTop = container.scrollHeight;
            prevConvId.current = conversationId;
            isPrepending.current = false;
            return;
        }

        if (isPrepending.current) {
            const heightDiff = container.scrollHeight - prevScrollHeight.current;
            container.scrollTop = container.scrollTop + heightDiff;
            isPrepending.current = false;
        } else {
            // For new messages (append), only scroll if user is near bottom
            const currentLastMessage = messages[messages.length - 1];
            if (currentLastMessage && currentLastMessage._id !== lastMessageId.current) {
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
                const isMyMessage = (currentLastMessage.sender as any)._id === currentUserId;
                
                if (isNearBottom || isMyMessage) {
                    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                }
                lastMessageId.current = currentLastMessage._id;
            }
        }
    }, [messages, conversationId, currentUserId]);

    // renderReactions is now inside MessageItem

    // renderReplySnippet is now inside MessageItem

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

            <AnimatePresence mode="wait">
                <motion.div
                    ref={containerRef}
                    key={conversationId}
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -5 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="chat-box"
                >
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

                            const prevMsg = messages[index - 1];
                            const isFirstInGroup = !prevMsg || (prevMsg.sender as any)?._id !== senderObj?._id || prevMsg.type === 'system';
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
                                <MessageItem 
                                    key={msg.tempId || msg._id}
                                    msg={msg}
                                    isMe={isMe}
                                    isRead={isRead}
                                    isGroupConversation={!!isGroup}
                                    isFirst={isFirstInGroup}
                                    isLast={isLastInGroup}
                                    showAvatar={showAvatar}
                                    currentUserId={currentUserId}
                                    searchQuery={searchQuery}
                                    onImagePreview={onImagePreview}
                                    onContextMenu={onContextMenu}
                                    onTouchStart={onTouchStart}
                                    onTouchEnd={onTouchEnd}
                                    onReplySnippetClick={scrollToMessage}
                                    uploadProgress={uploadProgress}
                                    reactions={msg.reactions}
                                />
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
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default memo(ChatBox);
