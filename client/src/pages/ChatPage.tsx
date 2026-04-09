import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Sidebar, { type Conversation } from "../components/chat/Sidebar";
import ChatBox, { type Message } from "../components/chat/ChatBox";
import MessageInput from "../components/chat/MessageInput";
import Avatar from "../components/common/Avatar";
import EditProfileModal from "../components/profile/EditProfileModal";

import { getConversationsApi, getMessagesApi } from "../api/chatApi";
import { connectSocket, disconnectSocket } from "../socket";

const ChatPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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

    return () => {
      socket.off("connect");
      socket.off("newMessage");
      socket.off("onlineUsers");
      socket.off("typing");
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
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    fetchMessages();
  }, [selectedConversationId]);

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
    <div style={{ display: "flex", height: "100vh", position: "relative" }}>
      <div
        style={{
          width: "320px",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
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

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
            <div style={{ fontSize: "36px" }}>💬</div>
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
              }}
            >
              {selectedConversation.isGroup ? (
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#0088cc", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                  👥
                </div>
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
