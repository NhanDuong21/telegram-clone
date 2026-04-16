import { useEffect, useMemo, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Phone, MoreVertical, PanelRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import Sidebar from "../../components/chat/Sidebar/Sidebar";
import ChatBox from "../../components/chat/ChatBox/ChatBox";
import MessageInput from "../../components/chat/MessageInput/MessageInput";
import Avatar from "../../components/common/Avatar";
import HeaderMenu from "../../components/chat/ChatBox/HeaderMenu";
import DeleteConfirmModal from "../../components/chat/Modals/DeleteConfirmModal";
import RightSidebar from "../../components/chat/RightSidebar/RightSidebar";
import GroupSettingsModal from "../../components/chat/GroupSettingsModal/GroupSettingsModal";
import ProfileModal from "../../components/profile/ProfileModal";
import type { ProfileMode } from "../../components/profile/ProfileModal";
import ImagePreviewModal from "../../components/chat/ImagePreviewModal/ImagePreviewModal";
import DeleteMessageModal from "../../components/chat/DeleteMessageModal/DeleteMessageModal";
import ForwardModal from "../../components/chat/ForwardModal/ForwardModal";
import PinModal from "../../components/chat/PinModal/PinModal";
import SearchSidebar from "../../components/chat/RightSidebar/SearchSidebar";
import { toggleBlockUserApi } from "../../api/userApi";
import CallModal from "../../components/chat/CallModal/CallModal";
import ConfirmModal from "../../components/chat/Modals/ConfirmModal";
import { sendMessageApi, removeFileApi } from "../../api/chatApi";
import SettingsModal from "../../components/chat/Settings/SettingsModal";

import { disconnectSocket, getSocket } from "../../socket";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useChatActions } from "../../hooks/useChatActions";
import type { Conversation, Message, User } from "../../types";
import { SOCKET_EVENTS } from "../../constants/socketEvents";
import { formatUserStatus } from "../../utils/formatters";
import './ChatPage.css';

const ChatPage = () => {
  const { user, logout, updateUser } = useAuth();

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
    toggleMuteConversation,
  } = useChatActions(user);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [editTarget, setEditTarget] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<{ msg: Message, fileUrl?: string } | null>(null);
  const [messageToPin, setMessageToPin] = useState<Message | null>(null);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);

  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  type RightPanelMode = 'none' | 'info' | 'search';
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('none');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showCallModal, setShowCallModal] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<ProfileMode>('VIEW');
  const [profileModalUser, setProfileModalUser] = useState<User | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [previewImageData, setPreviewImageData] = useState<{ url: string, messageId: string, senderId: string } | null>(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    isDanger?: boolean;
  } | null>(null);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    title: string;
    description: string;
    onConfirm: (deleteForBoth: boolean) => void;
    targetName?: string;
  } | null>(null);

  const [tempConversation, setTempConversation] = useState<Conversation | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleToggleBlock = async (targetId: string) => {
    try {
      const res = await toggleBlockUserApi(targetId);
      if (user) {
        updateUser({ ...user, blockedUsers: res.data.blockedUsers });
      }
    } catch (err) {
      console.error("Toggle block error:", err);
    }
  };

  const activeConversation = useMemo(() => {
    if (tempConversation && tempConversation._id === selectedConversationId) return tempConversation;
    return conversations.find(c => c._id === selectedConversationId) || null;
  }, [conversations, selectedConversationId, tempConversation]);

  const otherParticipant = useMemo(() => {
    if (!activeConversation || activeConversation.isGroup) return null;
    return activeConversation.participants.find((p: User) => p._id !== user?._id);
  }, [activeConversation, user?._id]);

  const isBlockedByMe = useMemo(() => {
    if (!user || !otherParticipant) return false;
    return (user.blockedUsers || []).includes(otherParticipant._id);
  }, [user, otherParticipant]);

  const amIBlocked = useMemo(() => {
    if (!user || !otherParticipant) return false;
    return (otherParticipant.blockedUsers || []).includes(user._id);
  }, [user, otherParticipant]);

  const shouldShowStatus = useMemo(() => !isBlockedByMe && !amIBlocked, [isBlockedByMe, amIBlocked]);

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
      if (selectedConversationId.startsWith("temp_")) {
        setMessages([]);
      } else {
        fetchMessages(selectedConversationId);
      }
      try {
        localStorage.setItem(`tg_sel_conv_${user?._id}`, selectedConversationId);
      } catch {}
    } else {
      setMessages([]); // Ensure messages are cleared when nothing is selected
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
    updateUser,
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

  const handleOpenMyProfile = () => {
    setProfileModalUser(null);
    setProfileModalMode('VIEW');
    setIsProfileModalOpen(true);
  };

  const handleDeletePreviewImage = async () => {
    if (!previewImageData) return;
    
    const msg = messages.find(m => m._id === previewImageData.messageId);
    if (msg) {
        setMessageToDelete({ msg, fileUrl: previewImageData.url });
    }
  };

  return (
    <div className="chat-page-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div className={`sidebar-wrapper ${selectedConversationId ? 'hidden-on-mobile' : ''}`}>
        <Sidebar 
          conversations={conversations}
          selectedId={selectedConversationId ?? ""}
          currentUserId={user?._id ?? ""}
          currentUser={user}
          onlineUsers={onlineUsers}
          unreadCounts={unreadCounts}
          onSelectConversation={handleSelectConversation}
          onTempConversationCreated={(conv) => {
            setTempConversation(conv);
            setSelectedConversationId(conv._id);
          }}
          onLogout={() => { disconnectSocket(); logout(); }}
          onOpenMyProfile={handleOpenMyProfile}
          onOpenSettings={() => setShowSettings(true)}
          onPinToggle={(conv, isPinned) => {
            setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, isPinned } : c));
            // API call would go here
          }}
          onMuteToggle={(conv) => toggleMuteConversation(conv._id)}
          onBlockUser={(targetUser) => {
            const blocked = (user?.blockedUsers || []).includes(targetUser._id);
            setConfirmModalConfig({
              title: blocked ? "Bỏ chặn người dùng" : `Chặn ${targetUser.username}`,
              description: blocked 
                ? `Bạn có chắc chắn muốn bỏ chặn ${targetUser.username}?`
                : `Bạn có chắc chắn muốn chặn ${targetUser.username}? Người này sẽ không thể nhắn tin cho bạn.`,
              onConfirm: () => {
                handleToggleBlock(targetUser._id);
                setConfirmModalConfig(null);
              },
              isDanger: !blocked
            });
          }}
          onClearHistory={(conv) => {
            const other = conv.participants.find(p => p._id !== user?._id);
            setDeleteModalConfig({
              title: "Xóa lịch sử",
              description: "Bạn có chắc chắn muốn xóa toàn bộ lịch sử tin nhắn? Hành động này không thể hoàn tác.",
              targetName: conv.isGroup ? conv.name : other?.username,
              onConfirm: (deleteForBoth) => {
                clearChat(conv._id, deleteForBoth);
                setDeleteModalConfig(null);
              }
            });
          }}
          onDeleteChat={(conv) => {
            const other = conv.participants.find(p => p._id !== user?._id);
            setDeleteModalConfig({
              title: "Xóa cuộc trò chuyện",
              description: "Bạn có chắc chắn muốn xóa cuộc trò chuyện này?",
              targetName: conv.isGroup ? conv.name : other?.username,
              onConfirm: (deleteForBoth) => {
                deleteConversation(conv._id, deleteForBoth);
                if (selectedConversationId === conv._id) setSelectedConversationId(null);
                setDeleteModalConfig(null);
              }
            });
          }}
        />
      </div>

      <motion.div 
        className={`chat-main-area ${selectedConversationId ? 'is-active' : 'hidden-on-mobile'}`}
        style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 }}
      >
        <AnimatePresence mode="wait">
          {!activeConversation ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="no-chat-placeholder"
            >
              <div className="placeholder-icon">💬</div>
              <div className="placeholder-title">Chọn một cuộc trò chuyện để bắt đầu</div>
              <div className="placeholder-subtitle">Hoặc tìm kiếm người dùng ở thanh bên trái</div>
            </motion.div>
          ) : (
            <motion.div 
              key={activeConversation._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <div className="chat-header">
                <div className="chat-header__info">
                  <button className="mobile-back-btn" onClick={() => setSelectedConversationId(null)}>
                    <ArrowLeft size={24} />
                  </button>
                  {activeConversation.isGroup ? (
                    <Avatar conversation={activeConversation} size={36} />
                  ) : (
                    <Avatar user={otherParticipant} size={36} />
                  )}
                    <div className="chat-header__text" onClick={(e) => {
                        e.stopPropagation();
                        if (!activeConversation.isGroup && otherParticipant) {
                          setProfileModalUser(otherParticipant);
                          setProfileModalMode('VIEW');
                          setIsProfileModalOpen(true);
                        }
                      }} style={{ cursor: activeConversation.isGroup ? 'default' : 'pointer' }}>
                      <span className="chat-header__name">{activeConversation.isGroup ? activeConversation.name : (otherParticipant?.fullName || otherParticipant?.username || "Chat")}</span>
                      {!activeConversation.isGroup && otherParticipant && (
                        <span className={`chat-header__status ${(shouldShowStatus && typingUsers.has(otherParticipant._id)) ? 'status-typing' : ((shouldShowStatus && onlineUsers.includes(otherParticipant._id)) ? 'status-online' : 'status-offline')}`}>
                          {(shouldShowStatus && typingUsers.has(otherParticipant._id))
                            ? "đang soạn tin..." 
                            : (shouldShowStatus 
                                ? formatUserStatus(onlineUsers.includes(otherParticipant._id), otherParticipant.lastSeen)
                                : ""
                              )}
                        </span>
                      )}
                      {activeConversation.isGroup && (
                        <span className="chat-header__status">
                          {typingUsers.size > 0 
                            ? `${Array.from(typingUsers)
                                .map(id => {
                                  const p = activeConversation.participants.find((p: User) => p._id === id);
                                  return p?.fullName || p?.username;
                                })
                                .filter(Boolean).join(", ")} đang soạn tin...`
                            : `${activeConversation.participants.length} thành viên`
                          }
                        </span>
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
                      isGroup={activeConversation.isGroup ?? false}
                      isMuted={activeConversation.isMuted ?? false}
                      onToggleMute={() => toggleMuteConversation(activeConversation._id)}
                      onDeleteChat={() => setDeleteModalConfig({
                          title: "Xóa cuộc trò chuyện",
                          description: "Bạn có chắc chắn muốn xóa cuộc trò chuyện này?",
                          targetName: otherParticipant?.username || "người kia",
                          onConfirm: (deleteForBoth) => {
                              deleteConversation(selectedConversationId!, deleteForBoth);
                              setSelectedConversationId(null);
                          }
                      })}
                      onClearChat={() => setDeleteModalConfig({
                          title: "Xóa lịch sử",
                          description: "Bạn có chắc chắn muốn xóa toàn bộ lịch sử tin nhắn? Hành động này không thể hoàn tác.",
                          targetName: otherParticipant?.username || "người kia",
                          onConfirm: (deleteForBoth) => clearChat(selectedConversationId!, deleteForBoth)
                      })}
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
                  isGroup={activeConversation.isGroup ?? false}
                  onImagePreview={(url, msgId, senderId) => setPreviewImageData(url && msgId && senderId ? { url, messageId: msgId, senderId } : null)}
                  onDeleteMessage={(msg, fileUrl) => setMessageToDelete({ msg, fileUrl })}
                  onReactMessage={handleReactMessage}
                  onReplyMessage={(msg) => { setEditTarget(null); setReplyTarget(msg); }}
                  onEditMessage={(msg) => { setReplyTarget(null); setEditTarget(msg); }}
                  onPinMessage={setMessageToPin}
                  onUnpinMessage={(msg) => updateMessage(msg._id, { isPinned: false })}
                  onForwardMessage={setMessageToForward}
                  conversationId={activeConversation._id}
                  uploadProgress={uploadProgress}
                />
              </div>


              {isBlockedByMe ? (
                <div className="blocked-banner" onClick={() => handleToggleBlock(otherParticipant!._id)}>
                  Bỏ chặn người dùng này
                </div>
              ) : amIBlocked ? (
                <div className="blocked-banner disabled">
                  Bạn không thể gửi tin nhắn cho người dùng này.
                </div>
              ) : (
                <MessageInput 
                  conversationId={activeConversation._id} 
                  onMessageSent={handleMessageSent} 
                  replyTarget={replyTarget}
                  editTarget={editTarget}
                  onCancelMode={() => { setReplyTarget(null); setEditTarget(null); }}
                  isTemporary={activeConversation.isTemporary}
                  otherUserId={otherParticipant?._id}
                  onConversationCreated={(conv) => {
                    setConversations(prev => [conv, ...prev]);
                    setSelectedConversationId(conv._id);
                    setTempConversation(null);
                  }}
                  onUploadProgress={(tempId, progress) => {
                    setUploadProgress(prev => {
                      if (progress === null) {
                        const newState = { ...prev };
                        delete newState[tempId];
                        return newState;
                      }
                      return { ...prev, [tempId]: progress };
                    });
                  }}
                />
              )}

              <AnimatePresence>
                {showGroupSettings && activeConversation.isGroup && (
                  <GroupSettingsModal
                    conversation={activeConversation}
                    currentUserId={user?._id ?? ""}
                    onClose={() => setShowGroupSettings(false)}
                    onUpdated={(updatedConv) => setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c))}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isProfileModalOpen && (
          <ProfileModal 
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            initialMode={profileModalMode}
            userToDisplay={
              profileModalUser && otherParticipant && profileModalUser._id === otherParticipant._id 
                ? otherParticipant 
                : profileModalUser
            }
            isMuted={activeConversation?.isMuted}
            onToggleMute={() => activeConversation && toggleMuteConversation(activeConversation._id)}
            onMessage={() => setIsProfileModalOpen(false)}
          />
        )}
        {previewImageData && (
          <ImagePreviewModal 
            imageUrl={previewImageData.url} 
            onClose={() => setPreviewImageData(null)} 
            onDelete={handleDeletePreviewImage}
            isOwner={previewImageData.senderId === user?._id}
          />
        )}
        {messageToDelete && (
          <DeleteMessageModal 
            onClose={() => setMessageToDelete(null)}
            onConfirm={async (type) => {
              if (messageToDelete) {
                if (messageToDelete.fileUrl) {
                  await removeFileApi(messageToDelete.msg._id, messageToDelete.fileUrl, type);
                  setPreviewImageData(null); // Close preview if it was open
                } else {
                  deleteMessage(messageToDelete.msg, type);
                }
                setMessageToDelete(null);
              }
            }}
            isSender={(messageToDelete.msg.sender as unknown as User)?._id === user?._id}
            isDeletingFile={!!messageToDelete.fileUrl}
            targetName={activeConversation?.isGroup ? "mọi người" : (activeConversation?.name || activeConversation?.participants[0]?.username)}
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
            targetName={activeConversation?.isGroup ? "mọi người" : (activeConversation?.name || activeConversation?.participants[0]?.username)}
          />
        )}
        <div className={`right-sidebar-wrapper ${rightPanelMode === 'info' ? 'is-open' : ''}`}>
           <RightSidebar 
            onClose={() => setRightPanelMode('none')}
            user={otherParticipant ?? null}
            conversation={activeConversation ?? null}
            isOnline={otherParticipant ? onlineUsers.includes(otherParticipant._id) : false}
            onToggleMute={toggleMuteConversation}
            onlineUsers={onlineUsers}
            currentUserId={user?._id}
            onGroupUpdated={(updatedConv) => setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c))}
          />
        </div>
        {rightPanelMode === 'search' && activeConversation && (
            <SearchSidebar 
                messages={messages}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClose={() => setRightPanelMode('none')}
                onScrollToMessage={handleScrollToMessage}
            />
        )}
        {confirmModalConfig && (
            <ConfirmModal 
                isOpen={!!confirmModalConfig}
                onClose={() => setConfirmModalConfig(null)}
                onConfirm={confirmModalConfig.onConfirm}
                title={confirmModalConfig.title}
                description={confirmModalConfig.description}
                confirmText={confirmModalConfig.confirmText}
                isDanger={confirmModalConfig.isDanger}
            />
        )}
         {showCallModal && <CallModal onClose={() => setShowCallModal(false)} />}
         {deleteModalConfig && (
             <DeleteConfirmModal 
                 isOpen={!!deleteModalConfig}
                 onClose={() => setDeleteModalConfig(null)}
                 onConfirm={deleteModalConfig.onConfirm}
                 title={deleteModalConfig.title}
                 description={deleteModalConfig.description}
                 targetName={deleteModalConfig.targetName}
             />
         )}
         <SettingsModal 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            user={user}
            onEditProfile={() => {
              setProfileModalUser(null);
              setProfileModalMode('EDIT');
              setIsProfileModalOpen(true);
            }}
         />
       </AnimatePresence>
     </div>
  );
};

export default memo(ChatPage);
