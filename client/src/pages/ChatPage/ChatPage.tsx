import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Phone, PanelRight, MoreVertical } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import Sidebar from "../../components/chat/Sidebar/Sidebar";
import ChatBox from "../../components/chat/ChatBox/ChatBox";
import MessageInput from "../../components/chat/MessageInput/MessageInput";
import Avatar from "../../components/common/Avatar";
import HeaderMenu from "../../components/chat/ChatBox/HeaderMenu";
import RightSidebar from "../../components/chat/RightSidebar/RightSidebar";
import GroupSettingsModal from "../../components/chat/GroupSettingsModal/GroupSettingsModal";
import EditProfileModal from "../../components/profile/EditProfileModal/EditProfileModal";
import UserProfileModal from "../../components/profile/UserProfileModal/UserProfileModal";
import ImagePreviewModal from "../../components/chat/ImagePreviewModal/ImagePreviewModal";
import DeleteMessageModal from "../../components/chat/DeleteMessageModal/DeleteMessageModal";
import ForwardModal from "../../components/chat/ForwardModal/ForwardModal";
import PinModal from "../../components/chat/PinModal/PinModal";
import SearchSidebar from "../../components/chat/RightSidebar/SearchSidebar";
import CallModal from "../../components/chat/CallModal/CallModal";
import { sendMessageApi } from "../../api/chatApi";

import { disconnectSocket, getSocket } from "../../socket";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useChatActions } from "../../hooks/useChatActions";
import type { Conversation, Message, User } from "../../types";
import { SOCKET_EVENTS } from "../../constants/socketEvents";
import { formatUserStatus } from "../../utils/formatters";
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useAuth();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(() => {
    if (user?._id) {
      try {
        return localStorage.getItem(`tg_sel_conv_${user._id}`);
      } catch {
        return null;
      }
    }
    return null;
  });

  const {
    conversations,
    setConversations,
    messages,
    setMessages,
    hasMore,
    loadingMore,
    fetchConversations,
    fetchMessages,
    loadOlderMessages,
    clearChat,
    deleteConversation,
    deleteMessage,
    updateMessage,
  } = useChatActions(user);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [editTarget, setEditTarget] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [messageToPin, setMessageToPin] = useState<Message | null>(null);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);

  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  type RightPanelMode = 'none' | 'info' | 'search';
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('none');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showCallModal, setShowCallModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const selectedConversation = useMemo(() => 
    conversations.find(c => c._id === selectedConversationId), 
    [conversations, selectedConversationId]
  );

  const otherParticipant = useMemo(() => {
    if (!selectedConversation || selectedConversation.isGroup) return null;
    return selectedConversation.participants.find((p: User) => p._id !== user?._id);
  }, [selectedConversation, user?._id]);

  useEffect(() => {
    fetchConversations();
    const socket = getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, user?._id);
    }
    
    return () => {
      disconnectSocket();
    };
  }, [user?._id]);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
      try {
        localStorage.setItem(`tg_sel_conv_${user?._id}`, selectedConversationId);
      } catch {}
    } else {
      try {
        localStorage.removeItem(`tg_sel_conv_${user?._id}`);
      } catch {}
    }
  }, [selectedConversationId, user?._id]);

  useChatSocket({
    user,
    selectedConversationId,
    setMessages,
    setConversations,
    setUnreadCounts,
    setOnlineUsers,
    setTypingUsers,
    setSelectedConversationId,
  });

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversationId(conv._id);
    setUnreadCounts(prev => ({ ...prev, [conv._id]: 0 }));
  };

  const handleMessageSent = (message: Message) => {
    setMessages((prev) => {
      const alreadyHasReal = prev.some(m => m._id === message._id);
      
      if (message.tempId) {
        if (alreadyHasReal) {
          return prev.filter(m => m._id !== message.tempId);
        }
        return prev.map(m => m._id === message.tempId ? message : m);
      }

      if (alreadyHasReal) {
        return prev.map(m => m._id === message._id ? message : m);
      }
      return [...prev, message];
    });

    setConversations(prev => {
      const index = prev.findIndex(c => c._id === message.conversationId);
      if (index === -1) return prev;
      const updatedConv = { ...prev[index], lastMessage: message, updatedAt: message.createdAt };
      const next = [...prev];
      next.splice(index, 1);
      return [updatedConv, ...next] as Conversation[];
    });
  };

  const handleReactMessage = (msg: Message, emoji: string) => {
    const socket = getSocket();
    socket?.emit(SOCKET_EVENTS.SEND_REACTION, { messageId: msg._id, emoji });
  };

  const handleLogout = () => {
    localStorage.removeItem("tg_token");
    window.location.href = "/login";
  };

  const handleScrollToMessage = (messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-pulse");
      setTimeout(() => element.classList.remove("highlight-pulse"), 2000);
    } else {
      // Possible scenario: message not in history chunk
      alert("Tin nhắn này ở xa quá, chưa tải lên kịp! Hãy cuộn lên để xem thêm.");
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar-wrapper">
        <Sidebar
          conversations={conversations}
          selectedId={selectedConversationId}
          currentUserId={user?._id ?? ""}
          currentUser={user}
          onlineUsers={onlineUsers}
          unreadCounts={unreadCounts}
          onSelectConversation={handleSelectConversation}
          onConversationCreated={(conv) => setConversations(prev => [conv, ...prev.filter(c => c._id !== conv._id)])}
          onViewProfile={setViewingProfileId}
          onLogout={handleLogout}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedConversationId || "empty"}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
          className={`chat-wrapper ${selectedConversation ? "is-active" : ""}`}
        >
          {!selectedConversation ? (
            <div className="no-chat-placeholder">
              <div className="placeholder-icon">💬</div>
              <div className="placeholder-title">Chọn một cuộc trò chuyện để bắt đầu</div>
              <div className="placeholder-subtitle">Hoặc tìm kiếm người dùng ở thanh bên trái</div>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="chat-header__info">
                  <button className="mobile-back-btn" onClick={() => setSelectedConversationId(null)}>←</button>
                  {selectedConversation.isGroup ? (
                    <div className="group-avatar">
                      {selectedConversation.imageUrl ? 
                        <img src={selectedConversation.imageUrl} alt={selectedConversation.name} /> 
                        : "👥"}
                    </div>
                  ) : (
                    <div className="chat-header__avatar-clickable" onClick={() => otherParticipant && setViewingProfileId(otherParticipant._id)}>
                      <Avatar user={otherParticipant} size={36} />
                    </div>
                  )}
                    <div className={`chat-header__text ${!selectedConversation.isGroup ? "chat-header__text-clickable" : ""}`} 
                       onClick={() => !selectedConversation.isGroup && otherParticipant && setViewingProfileId(otherParticipant._id)}>
                    <span className="chat-header__name">{selectedConversation.isGroup ? selectedConversation.name : (otherParticipant?.username ?? "Chat")}</span>
                    {!selectedConversation.isGroup && otherParticipant && (
                      <span className={`chat-header__status ${onlineUsers.includes(otherParticipant._id) ? 'status-online' : 'status-offline'}`}>
                        {formatUserStatus(onlineUsers.includes(otherParticipant._id), otherParticipant.lastSeen)}
                      </span>
                    )}
                    {selectedConversation.isGroup && (
                      <span className="chat-header__members">{selectedConversation.participants.length} thành viên</span>
                    )}
                  </div>
                </div>

                <div className="chat-header__actions">
                  <button 
                    className={`header-action-btn ${rightPanelMode === 'search' ? "active" : ""}`}
                    onClick={() => setRightPanelMode(prev => prev === 'search' ? 'none' : 'search')}
                  >
                    <Search size={22} />
                  </button>
                  <button className="header-action-btn" onClick={() => setShowCallModal(true)}>
                    <Phone size={22} />
                  </button>
                  <button 
                    className={`header-action-btn ${rightPanelMode === 'info' ? "active" : ""}`}
                    onClick={() => setRightPanelMode(prev => prev === 'info' ? 'none' : 'info')}
                  >
                    <PanelRight size={22} />
                  </button>
                  
                  <div className="chat-header__options-container">
                    <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="header-action-btn">
                      <MoreVertical size={22} />
                    </button>
                    <HeaderMenu 
                      isOpen={showOptionsMenu}
                      onClose={() => setShowOptionsMenu(false)}
                      isGroup={selectedConversation.isGroup}
                      onDeleteChat={() => deleteConversation(selectedConversationId!)}
                      onClearChat={() => clearChat(selectedConversationId!)}
                      onSettingsClick={() => setShowGroupSettings(true)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <ChatBox
                  messages={messages}
                  currentUserId={user?._id ?? ""}
                  searchQuery={searchQuery}
                  onLoadMore={() => loadOlderMessages(selectedConversationId!, messages[0].createdAt)}
                  hasMore={hasMore}
                  loadingMore={loadingMore}
                  isGroup={selectedConversation.isGroup}
                  onProfileClick={setViewingProfileId}
                  onImagePreview={setPreviewImageUrl}
                  onDeleteMessage={setMessageToDelete}
                  onReactMessage={handleReactMessage}
                  onReplyMessage={(msg) => { setEditTarget(null); setReplyTarget(msg); }}
                  onEditMessage={(msg) => { setReplyTarget(null); setEditTarget(msg); }}
                  onPinMessage={setMessageToPin}
                  onUnpinMessage={(msg) => updateMessage(msg._id, { isPinned: false })}
                  onForwardMessage={setMessageToForward}
                />
              </div>

              {typingUsers.size > 0 && (
                <div className="typing-indicator">
                  <TypingDots />
                  <span className="ml-2">
                    {Array.from(typingUsers)
                      .map(id => selectedConversation.participants.find((p: User) => p._id === id)?.username)
                      .filter(Boolean).join(", ")} đang soạn tin...
                  </span>
                </div>
              )}

              <MessageInput 
                conversationId={selectedConversation._id} 
                onMessageSent={handleMessageSent} 
                replyTarget={replyTarget}
                editTarget={editTarget}
                onCancelMode={() => { setReplyTarget(null); setEditTarget(null); }}
              />

              <AnimatePresence>
                {showGroupSettings && selectedConversation.isGroup && (
                  <GroupSettingsModal
                    conversation={selectedConversation}
                    currentUserId={user?._id ?? ""}
                    onClose={() => setShowGroupSettings(false)}
                    onUpdated={(updatedConv) => setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c))}
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
        {viewingProfileId && <UserProfileModal userId={viewingProfileId} onClose={() => setViewingProfileId(null)} />}
        {previewImageUrl && <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}
        {messageToDelete && (
          <DeleteMessageModal 
            onClose={() => setMessageToDelete(null)}
            onConfirm={(type) => {
              if (messageToDelete) {
                deleteMessage(messageToDelete, type);
                setMessageToDelete(null);
              }
            }}
            isSender={(messageToDelete.sender as unknown as User)?._id === user?._id}
            targetName={selectedConversation?.isGroup ? "mọi người" : (selectedConversation?.name || selectedConversation?.participants[0]?.username)}
          />
        )}
        {messageToForward && (
          <ForwardModal 
            message={messageToForward} 
            conversations={conversations}
            onClose={() => setMessageToForward(null)}
            onForward={async (convId, msg) => {
              try {
                const originalSourceId = msg.forwardFrom?._id || msg.sender._id;
                await sendMessageApi(convId, { 
                    text: msg.text, 
                    imageUrl: msg.imageUrl,
                    forwardFrom: originalSourceId
                });
                setMessageToForward(null);
              } catch (e) {
                console.error("Forward failed", e);
              }
            }}
          />
        )}
        {messageToPin && (
          <PinModal 
            onClose={() => setMessageToPin(null)}
            onConfirm={(isPinned, pinForBoth) => {
              if (messageToPin) {
                updateMessage(messageToPin._id, { isPinned, pinForBoth });
                setMessageToPin(null);
              }
            }}
            targetName={selectedConversation?.isGroup ? "mọi người" : (selectedConversation?.name || selectedConversation?.participants[0]?.username)}
          />
        )}
        {rightPanelMode === 'info' && selectedConversation && (
          <RightSidebar 
            onClose={() => setRightPanelMode('none')}
            user={otherParticipant}
            conversation={selectedConversation}
            isOnline={otherParticipant ? onlineUsers.includes(otherParticipant._id) : false}
          />
        )}
        {rightPanelMode === 'search' && selectedConversation && (
            <SearchSidebar 
                messages={messages}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClose={() => setRightPanelMode('none')}
                onScrollToMessage={handleScrollToMessage}
            />
        )}
        {showCallModal && <CallModal onClose={() => setShowCallModal(false)} />}
      </AnimatePresence>
    </div>
  );
};

const TypingDots = () => (
  <div className="flex gap-1 items-center h-4">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ y: [0, -4, 0] }}
        transition={{
          repeat: Infinity,
          duration: 0.6,
          delay: i * 0.15,
          ease: "easeInOut"
        }}
        className="w-1.5 h-1.5 bg-blue-500 rounded-full"
      />
    ))}
  </div>
);

export default ChatPage;
