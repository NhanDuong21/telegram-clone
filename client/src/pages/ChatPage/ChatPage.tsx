/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import Sidebar from "../../components/chat/Sidebar/Sidebar";
import ChatBox from "../../components/chat/ChatBox/ChatBox";
import MessageInput from "../../components/chat/MessageInput/MessageInput";
import Avatar from "../../components/common/Avatar";
import GroupSettingsModal from "../../components/chat/GroupSettingsModal";
import EditProfileModal from "../../components/profile/EditProfileModal";
import UserProfileModal from "../../components/profile/UserProfileModal/UserProfileModal";

import { disconnectSocket, getSocket } from "../../socket";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useChatActions } from "../../hooks/useChatActions";
import type { Conversation, Message } from "../../types/chat";
import { SOCKET_EVENTS } from "../../constants/socketEvents";
import './ChatPage.css';

const ChatPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
  } = useChatActions(user);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  useChatSocket({
    user,
    selectedConversationId,
    setConversations,
    setMessages,
    setUnreadCounts,
    setOnlineUsers,
    setTypingUsers,
    setSelectedConversationId,
  });

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversationId) {
      const socket = getSocket();
      if (socket) socket.emit(SOCKET_EVENTS.JOIN_ROOM, selectedConversationId);
      
      fetchMessages(selectedConversationId).catch(() => {
        setSelectedConversationId(null);
        if (user?._id) localStorage.removeItem(`tg_sel_conv_${user._id}`);
      });
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, user?._id, fetchMessages]);

  const handleLogout = () => {
    disconnectSocket();
    if (user?._id) localStorage.removeItem(`tg_sel_conv_${user._id}`);
    logout();
    navigate("/login");
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversationId(conv._id);
    setUnreadCounts((prev) => {
      const copy = { ...prev };
      delete copy[conv._id];
      return copy;
    });
    if (user?._id) localStorage.setItem(`tg_sel_conv_${user._id}`, conv._id);
  };

  const handleMessageSent = (message: Message) => {
    if (selectedConversationId) {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConversationId
            ? { ...c, lastMessage: { _id: message._id, text: message.text ?? "" } }
            : c
        )
      );
    }
  };

  const otherParticipant = selectedConversation?.participants.find((p) => p._id !== user?._id);

  return (
    <div className="app-container">
      <div className="sidebar-wrapper">
        <div className="sidebar-header">
          <div className="profile-section" onClick={() => setShowEditProfile(true)}>
            <Avatar user={user} size={32} />
            <span className="profile-username">{user?.username}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>

        <Sidebar
          conversations={conversations}
          selectedId={selectedConversationId}
          currentUserId={user?._id ?? ""}
          onlineUsers={onlineUsers}
          unreadCounts={unreadCounts}
          onSelectConversation={handleSelectConversation}
          onConversationCreated={(conv) => setConversations(prev => [conv, ...prev.filter(c => c._id !== conv._id)])}
          onViewProfile={setViewingProfileId}
        />
      </div>

      <div className={`chat-wrapper ${selectedConversation ? "is-active" : ""}`}>
        {!selectedConversation ? (
          <div className="no-chat-placeholder">
            <div style={{ fontSize: "36px" }}>💬</div>
            <div style={{ fontSize: "16px" }}>Chọn một cuộc trò chuyện để bắt đầu</div>
            <div style={{ fontSize: "13px", color: "#bbb" }}>Hoặc tìm kiếm người dùng ở thanh bên trái</div>
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
                  <div style={{ cursor: "pointer" }} onClick={() => otherParticipant && setViewingProfileId(otherParticipant._id)}>
                    <Avatar user={otherParticipant} size={36} />
                  </div>
                )}
                <div className="chat-header__text" style={{ cursor: !selectedConversation.isGroup ? "pointer" : "default" }} 
                     onClick={() => !selectedConversation.isGroup && otherParticipant && setViewingProfileId(otherParticipant._id)}>
                  <span className="chat-header__name">{selectedConversation.isGroup ? selectedConversation.name : (otherParticipant?.username ?? "Chat")}</span>
                  {!selectedConversation.isGroup && otherParticipant && onlineUsers.includes(otherParticipant._id) && (
                    <span className="chat-header__status">Online</span>
                  )}
                  {selectedConversation.isGroup && (
                    <span className="chat-header__members">{selectedConversation.participants.length} thành viên</span>
                  )}
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="options-btn">⋮</button>
                {showOptionsMenu && (
                  <div className="options-menu">
                    {selectedConversation.isGroup && (
                      <div onClick={() => { setShowOptionsMenu(false); setShowGroupSettings(true); }} className="menu-item">Cài đặt nhóm</div>
                    )}
                    <div onClick={() => { setShowOptionsMenu(false); clearChat(selectedConversationId!); }} className="menu-item menu-item--delete">Clear chat</div>
                    {!selectedConversation.isGroup && (
                      <div onClick={() => { setShowOptionsMenu(false); deleteConversation(selectedConversationId!); }} className="menu-item menu-item--delete-bold">Delete conversation</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <ChatBox
              messages={messages}
              currentUserId={user?._id ?? ""}
              onLoadMore={() => loadOlderMessages(selectedConversationId!, messages[0].createdAt)}
              hasMore={hasMore}
              loadingMore={loadingMore}
              isGroup={selectedConversation.isGroup}
              onProfileClick={setViewingProfileId}
            />

            {typingUsers.size > 0 && (
              <div className="typing-indicator">
                {Array.from(typingUsers)
                  .map(id => selectedConversation.participants.find(p => p._id === id)?.username)
                  .filter(Boolean).join(", ")} đang soạn tin...
              </div>
            )}

            <MessageInput conversationId={selectedConversation._id} onMessageSent={handleMessageSent} />

            {showGroupSettings && selectedConversation.isGroup && (
              <GroupSettingsModal
                conversation={selectedConversation}
                currentUserId={user?._id ?? ""}
                onClose={() => setShowGroupSettings(false)}
                onUpdated={(updatedConv) => setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c))}
              />
            )}
          </>
        )}
      </div>
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {viewingProfileId && <UserProfileModal userId={viewingProfileId} onClose={() => setViewingProfileId(null)} />}
    </div>
  );
};

export default ChatPage;
