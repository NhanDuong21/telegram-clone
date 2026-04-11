/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/chat/Sidebar";
import ChatBox from "../components/chat/ChatBox";
import MessageInput from "../components/chat/MessageInput";
import Avatar from "../components/common/Avatar";
import GroupSettingsModal from "../components/chat/GroupSettingsModal";
import EditProfileModal from "../components/profile/EditProfileModal";
import UserProfileModal from "../components/profile/UserProfileModal";

import { disconnectSocket, getSocket } from "../socket";
import { useChatSocket } from "../hooks/useChatSocket";
import { useChatActions } from "../hooks/useChatActions";
import type { Conversation, Message } from "../types/chat";
import { SOCKET_EVENTS } from "../constants/socketEvents";

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
        <div style={styles.sidebarHeader}>
          <div style={styles.profileSection} onClick={() => setShowEditProfile(true)}>
            <Avatar user={user} size={32} />
            <span style={styles.username}>{user?.username}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
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
          <div style={styles.noChatPlaceholder}>
            <div style={{ fontSize: "36px" }}>💬</div>
            <div style={{ fontSize: "16px" }}>Chọn một cuộc trò chuyện để bắt đầu</div>
            <div style={{ fontSize: "13px", color: "#bbb" }}>Hoặc tìm kiếm người dùng ở thanh bên trái</div>
          </div>
        ) : (
          <>
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderInfo}>
                <button className="mobile-back-btn" onClick={() => setSelectedConversationId(null)}>←</button>
                {selectedConversation.isGroup ? (
                  <div style={styles.groupAvatar}>
                    {selectedConversation.imageUrl ? 
                      <img src={selectedConversation.imageUrl} alt={selectedConversation.name} style={styles.groupImg} /> 
                      : "👥"}
                  </div>
                ) : (
                  <div style={{ cursor: "pointer" }} onClick={() => otherParticipant && setViewingProfileId(otherParticipant._id)}>
                    <Avatar user={otherParticipant} size={36} />
                  </div>
                )}
                <div style={{ ...styles.headerText, cursor: !selectedConversation.isGroup ? "pointer" : "default" }} 
                     onClick={() => !selectedConversation.isGroup && otherParticipant && setViewingProfileId(otherParticipant._id)}>
                  <span>{selectedConversation.isGroup ? selectedConversation.name : (otherParticipant?.username ?? "Chat")}</span>
                  {!selectedConversation.isGroup && otherParticipant && onlineUsers.includes(otherParticipant._id) && (
                    <span style={styles.onlineStatus}>Online</span>
                  )}
                  {selectedConversation.isGroup && (
                    <span style={styles.memberCount}>{selectedConversation.participants.length} thành viên</span>
                  )}
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} style={styles.optionsBtn}>⋮</button>
                {showOptionsMenu && (
                  <div style={styles.optionsMenu}>
                    {selectedConversation.isGroup && (
                      <div onClick={() => { setShowOptionsMenu(false); setShowGroupSettings(true); }} style={styles.menuItem}>Cài đặt nhóm</div>
                    )}
                    <div onClick={() => { setShowOptionsMenu(false); clearChat(selectedConversationId!); }} style={styles.deleteMenuItem}>Clear chat</div>
                    {!selectedConversation.isGroup && (
                      <div onClick={() => { setShowOptionsMenu(false); deleteConversation(selectedConversationId!); }} style={styles.deleteMenuItemBold}>Delete conversation</div>
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
            />

            {typingUsers.size > 0 && (
              <div style={styles.typingIndicator}>
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

const styles: Record<string, any> = {
  sidebarHeader: { padding: "10px 12px", borderBottom: "1px solid #ddd", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f5f5f5" },
  profileSection: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  username: { fontWeight: 600, fontSize: "14px" },
  logoutBtn: { padding: "4px 10px", fontSize: "12px", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "white", cursor: "pointer" },
  noChatPlaceholder: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#999", gap: "8px" },
  chatHeader: { padding: "10px 16px", borderBottom: "1px solid #eee", fontWeight: 600, fontSize: "15px", backgroundColor: "#f9f9f9", display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between" },
  chatHeaderInfo: { display: "flex", alignItems: "center", gap: "10px" },
  headerText: { display: "flex", flexDirection: "column" },
  onlineStatus: { fontSize: "12px", color: "#0088cc", fontWeight: "600", marginTop: "2px" },
  memberCount: { fontSize: "12px", color: "#666", fontWeight: "normal", marginTop: "2px" },
  groupAvatar: { width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#0088cc", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", overflow: "hidden" },
  groupImg: { width: "100%", height: "100%", objectFit: "cover" },
  optionsBtn: { background: "transparent", border: "none", cursor: "pointer", fontSize: "20px", color: "#0088cc", padding: "4px" },
  optionsMenu: { position: "absolute", right: 0, top: "100%", background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: "8px", zIndex: 10, minWidth: "150px", overflow: "hidden" },
  menuItem: { padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "14px" },
  deleteMenuItem: { padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "14px", color: "#d63031" },
  deleteMenuItemBold: { padding: "10px 16px", cursor: "pointer", color: "#d63031", fontSize: "14px", fontWeight: "bold" },
  typingIndicator: { fontSize: "12px", color: "#aaa", padding: "0 16px 8px 16px", fontStyle: "italic" },
};

export default ChatPage;
