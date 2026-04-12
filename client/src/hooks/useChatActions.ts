import { useState, useCallback } from "react";
import type { Message, Conversation, User } from "../types";
import {
  getConversationsApi,
  getMessagesApi,
  clearChatApi,
  deleteConversationApi,
  deleteMessageApi,
} from "../api/chatApi";
import { getSocket } from "../socket";
import { SOCKET_EVENTS } from "../constants/socketEvents";

export const useChatActions = (user: User | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await getConversationsApi();
      setConversations(res.data.conversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await getMessagesApi(conversationId);
      const fetchedMessages = res.data.messages;
      setMessages(fetchedMessages);
      setHasMore(res.data.hasMore);

      const socket = getSocket();
      if (socket && user?._id) {
        const hasUnread = fetchedMessages.some((m: Message) => 
          m.sender._id !== user._id && !(m.readBy || []).includes(user._id)
        );
        if (hasUnread) {
          socket.emit(SOCKET_EVENTS.MARK_AS_READ, { conversationId });
        }
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      throw error;
    }
  }, [user]);

  const loadOlderMessages = useCallback(async (conversationId: string, oldestTime: string) => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await getMessagesApi(conversationId, oldestTime);
      setMessages((prev) => [...res.data.messages, ...prev]);
      setHasMore(res.data.hasMore);
    } catch (error) {
      console.error("Failed to load older messages:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore]);

  const clearChat = async (conversationId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lịch sử trò chuyện?")) return;
    try {
      await clearChatApi(conversationId);
    } catch (e) {
      console.error("Clear chat error:", e);
      throw e;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm("Bạn có chắc chắn muốn Xóa hiển thị toàn bộ đoạn chat này?")) return;
    try {
      await deleteConversationApi(conversationId);
    } catch (e) {
      console.error("Delete conversation error:", e);
      throw e;
    }
  };

  const deleteMessageAction = async (msg: Message, type: 'one-way' | 'two-way') => {
    try {
      // Optimistic Update
      if (type === 'one-way') {
        setMessages(prev => prev.filter(m => m._id !== msg._id));
      } else {
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, text: "Tin nhắn đã bị xóa", imageUrl: "", isDeleted: true } : m));
      }

      // Update sidebar if last message
      setConversations(prev => prev.map(c => {
        if (c._id === msg.conversationId && c.lastMessage?._id === msg._id) {
          if (type === 'one-way') {
             // We don't have the "previous" last message easily here without another API call or more state
             // But for now, we leave it as is or show "Tin nhắn đã xóa"
             return { ...c, lastMessage: { ...c.lastMessage, text: "Tin nhắn đã xóa" } };
          } else {
            return { ...c, lastMessage: { ...c.lastMessage?._id ? { _id: msg._id, text: "Tin nhắn đã xóa" } : null, text: "Tin nhắn đã xóa" } };
          }
        }
        return c;
      }));

      await deleteMessageApi(msg._id, type);
    } catch (error) {
       console.error("Failed to delete message:", error);
       fetchMessages(msg.conversationId); // Revert on error
    }
  };

  return {
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
    deleteMessage: deleteMessageAction,
  };
};
