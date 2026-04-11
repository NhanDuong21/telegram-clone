import { useState, useCallback } from "react";
import type { Message, Conversation, User } from "../types/chat";
import {
  getConversationsApi,
  getMessagesApi,
  clearChatApi,
  deleteConversationApi,
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

      if (socket && user?._id) {
        fetchedMessages.forEach((m: any) => {
          if (m.sender._id !== user._id && !(m.readBy || []).includes(user._id)) {
            socket.emit(SOCKET_EVENTS.MARK_AS_READ, { messageId: m._id, conversationId: m.conversationId });
          }
        });
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
  };
};
