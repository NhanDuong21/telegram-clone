import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Sidebar, { type Conversation } from "../components/chat/Sidebar";
import ChatBox, { type Message } from "../components/chat/ChatBox";
import MessageInput from "../components/chat/MessageInput";
import Avatar from "../components/common/Avatar";
import GroupSettingsModal from "../components/chat/GroupSettingsModal";
import EditProfileModal from "../components/profile/EditProfileModal";

import { getConversationsApi, getMessagesApi } from "../api/chatApi";
import { connectSocket, disconnectSocket } from "../socket";

const ChatPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(() => {
      if (user?._id) {
          try { return localStorage.getItem(`tg_sel_conv_${user._id}`); } catch { return null; }
      }
      return null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  // States for UX presence tracking
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Profile modal state
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Derive selectedConversation from list + id (stable: only changes when id or list changes)
  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  // Ref to access latest selectedConversationId inside socket callback
  const selectedIdRef = useRef(selectedConversationId);
  selectedIdRef.current = selectedConversationId;

  const handleLogout = () => {
    disconnectSocket();
    if (user?._id) localStorage.removeItem(`tg_sel_conv_${user._id}`);
    logout();
    navigate("/login");
  };

  // Connect socket after auth
  useEffect(() => {
    if (!user) return;

    const socket = connectSocket();

    // Refetch conversations on reconnect (catches messages missed while offline)
    // Socket.IO fires "connect" on initial connection AND on every reconnect
    let isFirstConnect = true;
    socket.on("connect", () => {
      if (isFirstConnect) {
        isFirstConnect = false;
        return; // skip initial connect — conversations loaded by the other useEffect
      }
      // Reconnected — refetch conversations to sync sidebar
      getConversationsApi()
        .then((res) => setConversations(res.data.conversations))
        .catch((err) => console.error("Reconnect refetch failed:", err));
    });

    socket.on("newMessage", (message: Message) => {
      const convId = message.conversationId;

      // Append message to chat if this conversation is currently open
      if (selectedIdRef.current === convId) {
        setMessages((prev) => [...prev, message]);
      }

      // Update sidebar: known conversation → update lastMessage in-place
      // Unknown conversation (first message from new user) → refetch list
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === convId);

        if (exists) {
          return prev.map((c) =>
            c._id === convId
              ? { ...c, lastMessage: { _id: message._id, text: message.text } }
              : c,
          );
        }

        // Not found — trigger a refetch outside of setState
        getConversationsApi()
          .then((res) => setConversations(res.data.conversations))
          .catch((err) => console.error("Failed to refetch conversations:", err));

        // Return prev unchanged for now; the refetch will update state
        return prev;
      });
    });

    socket.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on("typing", ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(senderId);
        else next.delete(senderId);
        return next;
      });
    });

    socket.on("groupUpdated", (updatedGroup: Conversation) => {
      const isStillMember = updatedGroup.participants.some(p => p._id === user?._id);
      
      if (!isStillMember) {
        setConversations(prev => prev.filter(c => c._id !== updatedGroup._id));
        if (selectedIdRef.current === updatedGroup._id) {
          setSelectedConversationId(null);
          if (user?._id) localStorage.removeItem(`tg_sel_conv_${user._id}`);
        }
        return;
      }
      
      setConversations(prev => {
        const index = prev.findIndex(c => c._id === updatedGroup._id);
        if (index === -1) {
          return [updatedGroup, ...prev];
        }
        return prev.map(c => c._id === updatedGroup._id ? updatedGroup : c);
      });
    });

    return () => {
      socket.off("connect");
      socket.off("newMessage");
      socket.off("onlineUsers");
      socket.off("typing");
      socket.off("groupUpdated");
    };
  }, [user]);

  // Load conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await getConversationsApi();
        setConversations(res.data.conversations);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };
    fetchConversations();
  }, []);

  // Load messages when selected conversation ID changes
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setHasMore(false);
      return;
    }
    const fetchMessages = async () => {
      try {
        const res = await getMessagesApi(selectedConversationId);
        setMessages(res.data.messages);
        setHasMore(res.data.hasMore);
      } catch (error: any) {
        console.error("Failed to load messages:", error);
        if (error.response?.status === 404) {
            setSelectedConversationId(null);
            if (user?._id) localStorage.removeItem(`tg_sel_conv_${user._id}`);
        }
      }
    };
    fetchMessages();
  }, [selectedConversationId, user?._id]);

  const loadOlderMessages = async () => {
    if (!selectedConversationId || messages.length === 0 || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
        const oldestMessageTime = messages[0].createdAt;
        const res = await getMessagesApi(selectedConversationId, oldestMessageTime);
        setMessages((prev) => [...res.data.messages, ...prev]);
        setHasMore(res.data.hasMore);
    } catch (error) {
        console.error("Failed to load older messages:", error);
    } finally {
        setLoadingMore(false);
    }
  };

  const handleConversationCreated = (conv: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === conv._id);
      if (exists) return prev;
      return [conv, ...prev];
    });
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversationId(conv._id);
    if (user?._id) {
        localStorage.setItem(`tg_sel_conv_${user._id}`, conv._id);
    }
  };

  const handleMessageSent = (message: Message) => {
    setMessages((prev) => [...prev, message]);

    if (selectedConversationId) {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConversationId
            ? { ...c, lastMessage: { _id: message._id, text: message.text } }
            : c,
        ),
      );
    }
  };

  // Derive other participant and typing status
  const otherParticipant = selectedConversation?.participants.find(
    (p) => p._id !== user?._id
  );
  const isOtherParticipantTyping = otherParticipant && typingUsers.has(otherParticipant._id);

  return (
    <div className="app-container">
      <div className="sidebar-wrapper">
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div 
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} 
            onClick={() => setShowEditProfile(true)}
            title="Edit Profile"
          >
            <Avatar user={user} size={32} />
            <span style={{ fontWeight: 600, fontSize: "14px" }}>{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        <Sidebar
          conversations={conversations}
          selectedId={selectedConversationId}
          currentUserId={user?._id ?? ""}
          onlineUsers={onlineUsers}
          onSelectConversation={handleSelectConversation}
          onConversationCreated={handleConversationCreated}
        />
      </div>

      <div className={`chat-wrapper ${selectedConversation ? "is-active" : ""}`}>
        {!selectedConversation ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              gap: "8px",
            }}
          >
            <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "64px", height: "64px", opacity: 0.3, color: "#0088cc" }}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <div style={{ fontSize: "16px" }}>
              Chọn một cuộc trò chuyện để bắt đầu
            </div>
            <div style={{ fontSize: "13px", color: "#bbb" }}>
              Hoặc tìm kiếm người dùng ở thanh bên trái
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid #eee",
                fontWeight: 600,
                fontSize: "15px",
                backgroundColor: "#f9f9f9",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  className="mobile-back-btn" 
                  onClick={() => {
                    setSelectedConversationId(null);
                  }}
                  title="Quay lại"
                >
                  ←
                </button>
                {selectedConversation.isGroup ? (
                    selectedConversation.imageUrl ? (
                        <img src={selectedConversation.imageUrl} alt={selectedConversation.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#0088cc", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold" }}>
                          {selectedConversation.name ? selectedConversation.name.substring(0, 1).toUpperCase() : "G"}
                        </div>
                    )
                ) : (
                  <Avatar user={otherParticipant} size={36} />
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{selectedConversation.isGroup ? selectedConversation.name : (otherParticipant?.username ?? "Chat")}</span>
                  {selectedConversation.isGroup && (
                      <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal", marginTop: "2px" }}>
                        {selectedConversation.participants.length} thành viên
                      </span>
                  )}
                </div>
              </div>

              {selectedConversation.isGroup && (
                  <button
                    onClick={() => setShowGroupSettings(true)}
                    style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        fontSize: "20px", color: "#0088cc",
                        padding: "4px"
                    }}
                    title="Cài đặt nhóm"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "22px", height: "22px" }}>
                       <circle cx="12" cy="12" r="1.5"></circle>
                       <circle cx="12" cy="5" r="1.5"></circle>
                       <circle cx="12" cy="19" r="1.5"></circle>
                    </svg>
                  </button>
              )}
            </div>

            <ChatBox 
              messages={messages} 
              currentUserId={user?._id ?? ""} 
              onLoadMore={loadOlderMessages}
              hasMore={hasMore}
              loadingMore={loadingMore}
              isGroup={selectedConversation.isGroup}
            />

            {/* Typing Indicator */}
            {isOtherParticipantTyping && !selectedConversation.isGroup && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#aaa",
                  padding: "0 16px 8px 16px",
                  fontStyle: "italic",
                }}
              >
                {otherParticipant?.username} đang soạn tin...
              </div>
            )}

            <MessageInput
              conversationId={selectedConversation._id}
              receiverId={otherParticipant?._id}
              onMessageSent={handleMessageSent}
            />

            {showGroupSettings && selectedConversation.isGroup && (
                <GroupSettingsModal
                    conversation={selectedConversation}
                    currentUserId={user?._id ?? ""}
                    onClose={() => setShowGroupSettings(false)}
                    onUpdated={(updatedConv) => {
                        setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c));
                    }}
                />
            )}
          </>
        )}
      </div>

      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
};

export default ChatPage;
