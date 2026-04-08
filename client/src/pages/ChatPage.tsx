import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Sidebar, { type Conversation } from "../components/chat/Sidebar";
import ChatBox, { type Message } from "../components/chat/ChatBox";
import MessageInput from "../components/chat/MessageInput";

import { getConversationsApi, getMessagesApi } from "../api/chatApi";
import { connectSocket, disconnectSocket } from "../socket";

const ChatPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Ref to access latest selectedConversation inside socket callback
  const selectedConvRef = useRef(selectedConversation);
  selectedConvRef.current = selectedConversation;

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate("/login");
  };

  // Connect socket after auth
  useEffect(() => {
    if (!user) return;

    const socket = connectSocket(user._id);

    socket.on("newMessage", (message: Message) => {
      const convId = (message as any).conversationId;

      // If the user is viewing this conversation, add the message to the list
      if (selectedConvRef.current && selectedConvRef.current._id === convId) {
        setMessages((prev) => [...prev, message]);
      }

      // Update sidebar lastMessage preview
      setConversations((prev) =>
        prev.map((c) =>
          c._id === convId
            ? { ...c, lastMessage: { _id: message._id, text: message.text } }
            : c,
        ),
      );
    });

    return () => {
      socket.off("newMessage");
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

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        const res = await getMessagesApi(selectedConversation._id);
        setMessages(res.data.messages);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    fetchMessages();
  }, [selectedConversation]);

  const handleConversationCreated = (conv: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === conv._id);
      if (exists) return prev;
      return [conv, ...prev];
    });
  };

  const handleMessageSent = (message: Message) => {
    setMessages((prev) => [...prev, message]);

    if (selectedConversation) {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConversation._id
            ? { ...c, lastMessage: { _id: message._id, text: message.text } }
            : c,
        ),
      );
    }
  };

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
          <span style={{ fontWeight: 600 }}>{user?.username}</span>
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
          selectedId={selectedConversation?._id ?? null}
          currentUserId={user?._id ?? ""}
          onSelectConversation={setSelectedConversation}
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
              }}
            >
              {selectedConversation.participants.find(
                (p) => p._id !== user?._id,
              )?.username ?? "Chat"}
            </div>

            <ChatBox messages={messages} currentUserId={user?._id ?? ""} />

            <MessageInput
              conversationId={selectedConversation._id}
              onMessageSent={handleMessageSent}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
