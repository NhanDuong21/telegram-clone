import { useEffect, useRef, useMemo, memo, useLayoutEffect, useState } from "react";
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
    const [showScrollDown, setShowScrollDown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastMessageId = useRef<string | null>(null);
    const prevConvId = useRef<string | null>(null);
    const prevMessagesLength = useRef<number>(0);
    const prevScrollHeight = useRef<number>(0);
    const topObserverRef = useRef<HTMLDivElement>(null);
    const isPrepending = useRef<boolean>(false);
    const wasAtBottom = useRef<boolean>(true);

    const { pos, targetItem, targetFileUrl, onContextMenu, onTouchStart, onTouchEnd, closeContextMenu } = useContextMenu();

    const pinnedMessages = useMemo(() => 
        messages.filter(m => m.isPinned || m.pinnedFor?.includes(currentUserId)), 
    [messages, currentUserId]);
    const latestPinned = pinnedMessages[pinnedMessages.length - 1];

    const markAsRead = () => {
        if (!currentUserId || !conversationId || messages.length === 0) return;
        if (!document.hasFocus()) return;

        const lastMsg = messages[messages.length - 1];
        const senderId = (lastMsg.sender as any)._id || lastMsg.sender;
        
        // Only mark if the last message is NOT from me and I haven't read it yet
        const isMe = String(senderId) === String(currentUserId);
        const alreadyReadByMe = lastMsg.readBy?.some(r => String((r as any)._id || r) === String(currentUserId));

        if (!isMe && !alreadyReadByMe) {
            console.log("📤 SOCKET EMITTED: mark_as_read for chat:", conversationId);
            const socket = getSocket();
            if (socket) {
                socket.emit(SOCKET_EVENTS.MARK_AS_READ, { 
                    conversationId, 
                    userId: currentUserId 
                });
            }
        }
    };

    useEffect(() => {
        markAsRead();
        
        // Handlers for mobile interactions to ensure receipts are real
        const handleInteraction = () => {
            markAsRead();
        };

        window.addEventListener('focus', handleInteraction);
        window.addEventListener('touchstart', handleInteraction, { passive: true });
        
        return () => {
            window.removeEventListener('focus', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, [messages.length, conversationId]);

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

    // --- SMART SCROLL LOGIC ---
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        const container = containerRef.current;
        if (!container) return;
        container.scrollTo({
            top: container.scrollHeight,
            behavior
        });
    };

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;
        
        // Use a more generous threshold for mobile/fractional scroll
        const threshold = 200;
        const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
        
        wasAtBottom.current = isBottom;
        setShowScrollDown(!isBottom);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // --- INFINITE SCROLL OBSERVER ---
    useEffect(() => {
        if (!hasMore || loadingMore || !onLoadMore || !containerRef.current) return;

        console.log(`[ChatBox] Setting up observer. hasMore: ${hasMore}, loadingMore: ${loadingMore}`);

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    console.log("[ChatBox] Top sentinel intersected! Loading more...");
                    onLoadMore();
                }
            },
            { 
                root: containerRef.current, // Observe within the scrollable container
                threshold: 0.1 
            }
        );

        if (topObserverRef.current) {
            observer.observe(topObserverRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadingMore, onLoadMore, conversationId]); // Added conversationId to reset on switch

    // --- DETECT PREPEND VS APPEND ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Detect if we are prepending (loading history)
        const isSwitch = prevConvId.current !== conversationId;
        const msgLengthDiff = messages.length - prevMessagesLength.current;
        
        if (!isSwitch && msgLengthDiff > 0 && messages.length > 0 && prevMessagesLength.current > 0) {
            // Check if the last message is new
            const currentLastId = messages[messages.length - 1]._id;
            const prevLastId = lastMessageId.current;
            
            if (currentLastId !== prevLastId) {
                // Potential append
                isPrepending.current = false;
            } else {
                // Potential prepend
                isPrepending.current = true;
            }
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
            prevConvId.current = conversationId ?? null;
            isPrepending.current = false;
            return;
        }

        if (isPrepending.current) {
            const heightDiff = container.scrollHeight - prevScrollHeight.current;
            container.scrollTop = container.scrollTop + heightDiff;
            isPrepending.current = false;
        } else {
            // Smart Append Logic
            const currentLastMessage = messages[messages.length - 1];
            if (currentLastMessage && currentLastMessage._id !== lastMessageId.current) {
                const msgSenderId = (currentLastMessage.sender as any)._id || currentLastMessage.sender;
                const isMe = String(msgSenderId) === String(currentUserId);
                
                if (isMe) {
                    // Own messages: Always scroll
                    scrollToBottom('auto');
                } else if (wasAtBottom.current) {
                    // Receiver AND was at bottom: Wait for DOM expansion then scroll
                    setTimeout(() => {
                        scrollToBottom('smooth');
                    }, 50);
                }
                // If not at bottom and not my message, we stay put (wasAtBottom.current is already tracked)
                
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
                        style={{ position: 'relative' }}
                    >
                        {/* Sentinel for infinite scroll - MUST be inside the scrollable container */}
                        <div ref={topObserverRef} className="chat-box-top-sentinel" style={{ height: '1px', width: '100%', pointerEvents: 'none' }} />
                        
                        {messages.length === 0 && (
                            <div className="chat-box--empty">
                                <span className="chat-box__empty-icon">👋</span>
                                Chưa có tin nhắn nào. Hãy nói lời chào!
                            </div>
                        )}
                        
                        {(loadingMore || (hasMore && messages.length > 0)) && (
                            <div className="chat-box__load-more">
                                {loadingMore ? (
                                    <div className="loading-spinner">Đang tải tin nhắn cũ...</div>
                                ) : (
                                    <div className="chat-box__load-more-hint">Cuộn lên để xem thêm</div>
                                )}
                            </div>
                        )}
                    
                    <AnimatePresence initial={false} mode="popLayout">
                        {messages.map((msg, index) => {
                            const msgSenderId = (msg.sender as any)._id || msg.sender;
                            const isMe = String(msgSenderId) === String(currentUserId);
                            // Read logic: has ANYONE else read it?
                            const isReadByOthers = (msg.readBy || []).some((r: any) => String((r as any)._id || r) !== String(currentUserId));
                            const isRead = !!(isReadByOthers || msg.isRead);
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
                                    onMediaLoad={() => {
                                        if (wasAtBottom.current) {
                                            scrollToBottom('smooth');
                                        }
                                    }}
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

                    <AnimatePresence>
                        {showScrollDown && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, y: 10 }}
                                className="scroll-down-btn"
                                onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                                title="Xuống cuối"
                            >
                                <div className="scroll-down-icon">↓</div>
                                {messages.some(m => !m.isRead && (m.sender as any)._id !== currentUserId) && <div className="new-msg-dot" />}
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div ref={bottomRef} />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default memo(ChatBox);
