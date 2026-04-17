import { useState, useCallback } from "react";
import type { Message, Conversation, User } from "../types";
import {
  getConversationsApi,
  getMessagesApi,
  clearChatApi,
  deleteConversationApi,
  deleteMessageApi,
  updateMessageApi,
  sendMessageApi,
} from "../api/chatApi";
import { getSocket } from "../socket";
import { SOCKET_EVENTS } from "../constants/socketEvents";

export const useChatActions = (user: User | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
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
      setPage(1); // Reset page on new chat
      const res = await getMessagesApi(conversationId, 1);
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

  const loadOlderMessages = useCallback(async (conversationId: string) => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await getMessagesApi(conversationId, nextPage);
      setMessages((prev) => [...res.data.messages, ...prev]);
      setHasMore(res.data.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load older messages:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page]);

  const clearChat = async (conversationId: string, deleteForBoth: boolean = false) => {
    try {
      await clearChatApi(conversationId, deleteForBoth);
    } catch (e) {
      console.error("Clear chat error:", e);
      throw e;
    }
  };

  const deleteConversation = async (conversationId: string, deleteForBoth: boolean = false) => {
    try {
      await deleteConversationApi(conversationId, deleteForBoth);
    } catch (e) {
      console.error("Delete conversation error:", e);
      throw e;
    }
  };

  const updateMessageAction = async (messageId: string, data: { text?: string, isPinned?: boolean, pinForBoth?: boolean }) => {
    try {
      // Optimistic Update
      setMessages(prev => prev.map(m => {
          if (m._id !== messageId) return m;
          const updated = { ...m, ...data, isEdited: data.text !== undefined ? true : m.isEdited };
          
          if (data.isPinned !== undefined) {
              if (data.isPinned) {
                  if (data.pinForBoth) {
                      updated.isPinned = true;
                  } else if (user?._id) {
                      updated.pinnedFor = [...(m.pinnedFor || []), user._id];
                  }
              } else {
                  updated.isPinned = false;
                  if (user?._id) {
                      updated.pinnedFor = (m.pinnedFor || []).filter(id => id !== user._id);
                  }
              }
          }
          return updated as Message;
      }));
      
      // Update sidebar if last message and text changed
      if (data.text) {
        setConversations(prev => prev.map(c => 
          c.lastMessage?._id === messageId 
            ? { ...c, lastMessage: { ...c.lastMessage, text: data.text! } } 
            : c
        ));
      }

      await updateMessageApi(messageId, data);

      // Successfully pinned/unpinned globally? Trigger system message
      if (data.isPinned !== undefined && user?._id) {
          const msg = messages.find(m => m._id === messageId);
          if (msg) {
              if (data.isPinned && data.pinForBoth) {
                await sendMessageApi(msg.conversationId, {
                    text: `${user.username} đã ghim một tin nhắn.`,
                    type: 'system'
                });
              } else if (data.isPinned === false && msg.isPinned) {
                // Was pinned globally before, now unpinning globally
                await sendMessageApi(msg.conversationId, {
                    text: `${user.username} đã bỏ ghim tin nhắn.`,
                    type: 'system'
                });
              }
          }
      }
    } catch (error) {
      console.error("Failed to update message:", error);
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
          return { 
            ...c, 
            lastMessage: c.lastMessage ? { ...c.lastMessage, text: "Tin nhắn đã xóa" } : null 
          };
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
    updateMessage: updateMessageAction,
    toggleMuteConversation: (conversationId: string) => {
      setConversations(prev => prev.map(c => 
        c._id === conversationId ? { ...c, isMuted: !c.isMuted } : c
      ));
      // In a real app, you would call: await axios.put(`/api/conversations/${conversationId}/mute`);
    },
  };
};
