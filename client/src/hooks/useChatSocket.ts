import { useEffect, useRef } from "react";
import { connectSocket } from "../socket";
import type { Message, Conversation, User } from "../types";
import { getConversationsApi } from "../api/chatApi";
import { SOCKET_EVENTS } from "../constants/socketEvents";

interface UseChatSocketProps {
  user: User | null;
  selectedConversationId: string | null;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setOnlineUsers: React.Dispatch<React.SetStateAction<string[]>>;
  setTypingUsers: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useChatSocket = ({
  user,
  selectedConversationId,
  setConversations,
  setMessages,
  setUnreadCounts,
  setOnlineUsers,
  setTypingUsers,
  setSelectedConversationId,
}: UseChatSocketProps) => {
  const selectedIdRef = useRef<string | null>(selectedConversationId);

  useEffect(() => {
    selectedIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    if (!user) return;

    const socket = connectSocket();

    let isFirstConnect = true;
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      if (isFirstConnect) {
        isFirstConnect = false;
        return;
      }
      getConversationsApi()
        .then((res) => setConversations(res.data.conversations))
        .catch((err) => console.error("Reconnect refetch failed:", err));
    });

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, (message: Message) => {
      const convId = message.conversationId;

      if (selectedIdRef.current === convId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        
        if (user?._id && message.sender._id !== user._id) {
          socket.emit(SOCKET_EVENTS.MARK_AS_READ, { 
            messageId: message._id, 
            conversationId: convId 
          });
        }
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [convId]: (prev[convId] || 0) + 1,
        }));
      }

      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === convId);
        if (index !== -1) {
          const updatedConv = {
            ...prev[index],
            lastMessage: { _id: message._id, text: message.text ?? "" },
            updatedAt: message.createdAt
          };
          const next = [...prev];
          next.splice(index, 1);
          return [updatedConv, ...next];
        }
        
        getConversationsApi()
          .then((res) => setConversations(res.data.conversations))
          .catch((err) => console.error("Failed to refetch conversations:", err));
        return prev;
      });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_READ, ({ messageId, userId, conversationId: convId }) => {
      if (selectedIdRef.current === convId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m._id === messageId) {
              const currentReadBy = m.readBy || [];
              if (!currentReadBy.includes(userId)) {
                return { ...m, readBy: [...currentReadBy, userId] };
              }
            }
            return m;
          })
        );
      }
    });

    socket.on(SOCKET_EVENTS.ONLINE_USERS, (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on(SOCKET_EVENTS.TYPING, ({ senderId, isTyping, conversationId: typingConvId }: { senderId: string; isTyping: boolean, conversationId?: string }) => {
      // Typing indicators should only show if we are in that conversation
      if (selectedIdRef.current === typingConvId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          if (isTyping) next.add(senderId);
          else next.delete(senderId);
          return next;
        });
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_UPDATED, (updatedGroup: Conversation) => {
      const isStillMember = updatedGroup.participants.some((p: User) => p._id === user?._id);

      if (!isStillMember) {
        setConversations((prev) => prev.filter((c) => c._id !== updatedGroup._id));
        if (selectedIdRef.current === updatedGroup._id) {
          setSelectedConversationId(null);
          if (user?._id) localStorage.removeItem(`tg_sel_conv_${user._id}`);
        }
        return;
      }

      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === updatedGroup._id);
        if (index === -1) return [updatedGroup, ...prev];
        return prev.map((c) => (c._id === updatedGroup._id ? updatedGroup : c));
      });
    });

    socket.on(SOCKET_EVENTS.GROUP_DELETED, ({ conversationId }: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (selectedIdRef.current === conversationId) {
        setSelectedConversationId(null);
        if (user?._id) localStorage.removeItem(`tg_sel_conv_${user._id}`);
      }
    });

    socket.on(SOCKET_EVENTS.CONVERSATION_CLEARED, ({ conversationId }: { conversationId: string }) => {
      if (selectedIdRef.current === conversationId) {
        setMessages([]);
      }
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, lastMessage: null } : c))
      );
    });

    socket.on(SOCKET_EVENTS.CONVERSATION_DELETED, ({ conversationId }: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (selectedIdRef.current === conversationId) {
        setSelectedConversationId(null);
        if (user?._id) localStorage.removeItem(`tg_sel_conv_${user._id}`);
      }
    });

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
      socket.off(SOCKET_EVENTS.ONLINE_USERS);
      socket.off(SOCKET_EVENTS.TYPING);
      socket.off(SOCKET_EVENTS.GROUP_UPDATED);
      socket.off(SOCKET_EVENTS.GROUP_DELETED);
      socket.off(SOCKET_EVENTS.CONVERSATION_CLEARED);
      socket.off(SOCKET_EVENTS.CONVERSATION_DELETED);
      socket.off(SOCKET_EVENTS.MESSAGE_READ);
    };
  }, [user]);
};
