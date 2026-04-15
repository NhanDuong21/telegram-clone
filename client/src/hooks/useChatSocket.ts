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
  updateUser?: (user: User) => void;
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
  updateUser,
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

      // Prevent duplicate if I'm the sender (Optimistic UI handles normal text/image messages)
      if (message.sender._id === user?._id && message.type !== 'system') {
          // But still update the sidebar/conversation list
          setConversations((prev) => {
            const index = prev.findIndex((c) => c._id === convId);
            if (index === -1) return prev;
            const updatedConv = {
                ...prev[index],
                lastMessage: { 
                  _id: message._id, 
                  text: message.text || "", 
                  type: message.type,
                  imageUrl: message.imageUrl,
                  isDeleted: message.isDeleted,
                  isRead: false,
                  createdAt: message.createdAt
                },
                updatedAt: message.createdAt
            };
            const next = [...prev];
            next.splice(index, 1);
            return [updatedConv, ...next];
          });
          return;
      }

      if (selectedIdRef.current === convId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        
        if (user?._id && message.sender._id !== user._id && !String(convId).startsWith("temp_")) {
          socket.emit(SOCKET_EVENTS.MARK_AS_READ, { 
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
            lastMessage: { 
              _id: message._id, 
              text: message.text || "", 
              type: message.type,
              imageUrl: message.imageUrl,
              isDeleted: message.isDeleted,
              isRead: (message.sender._id !== user._id) && (selectedIdRef.current === convId),
              createdAt: message.createdAt
            },
            unreadCount: (message.sender._id !== user._id) && (selectedIdRef.current === convId) ? 0 : (prev[index].unreadCount || 0) + (message.sender._id !== user._id ? 1 : 0),
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
                return { ...m, readBy: [...currentReadBy, userId], isRead: true };
              }
              return { ...m, isRead: true };
            }
            return m;
          })
        );
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGES_READ, ({ conversationId: convId, readerId }) => {
      console.log("🔥 SOCKET RECEIVED: messages_read for chat:", convId, "by reader:", readerId);
      // Use String() for safe comparison
      if (String(selectedIdRef.current) === String(convId)) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            // Only update messages SENT BY ME (the current user) if someone else read them
            const msgSenderId = (msg.sender as any)._id || msg.sender;
            if (String(msgSenderId) === String(user?._id) && !msg.isRead) {
               return { ...msg, isRead: true };
            }
            return msg;
          })
        );
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === convId && c.lastMessage) {
              // If the current user is NOT the reader, but sent the last message, they should see ticks
              return {
                  ...c,
                  lastMessage: { ...c.lastMessage, isRead: true }
              };
          }
          return c;
        })
      );
    });

    socket.on(SOCKET_EVENTS.ONLINE_USERS, (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on(SOCKET_EVENTS.TYPING, ({ senderId, conversationId: typingConvId }: { senderId: string; conversationId: string }) => {
      if (selectedIdRef.current === typingConvId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.add(senderId);
          return next;
        });
      }
    });

    socket.on(SOCKET_EVENTS.STOP_TYPING, ({ senderId, conversationId: typingConvId }: { senderId: string; conversationId: string }) => {
      if (selectedIdRef.current === typingConvId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(senderId);
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
      if (String(selectedIdRef.current) === String(conversationId)) {
        setMessages(() => []);
      }
      setConversations((prev) =>
        prev.map((c) => (String(c._id) === String(conversationId) ? { ...c, lastMessage: null } : c))
      );
    });

    socket.on(SOCKET_EVENTS.CONVERSATION_DELETED, ({ conversationId }: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => String(c._id) !== String(conversationId)));
      if (String(selectedIdRef.current) === String(conversationId)) {
        setMessages(() => []);
        setSelectedConversationId(null);
        if (user?._id) localStorage.removeItem(`tg_sel_conv_${user._id}`);
      }
    });

    // MARK_AS_READ is now handled by interaction/focus in ChatBox.tsx

    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, ({ messageId, conversationId: deletedConvId, type, userId: actorId }) => {
      if (selectedIdRef.current === deletedConvId) {
        if (type === 'one-way') {
           if (actorId === user?._id) {
               setMessages((prev) => prev.filter((m) => m._id !== messageId));
           }
        } else {
           setMessages((prev) =>
             [...prev.map((m) =>
               m._id === messageId ? { ...m, text: "Tin nhắn đã bị xóa", imageUrl: "", isDeleted: true } : m
             )]
           );
        }
      }

      if (type === 'two-way') {
        setConversations((prev) =>
          prev.map((c) => {
            if (c._id === deletedConvId && c.lastMessage?._id === messageId) {
              return { 
                ...c, 
                lastMessage: c.lastMessage ? { 
                    ...c.lastMessage, 
                    isDeleted: true, 
                    text: "Tin nhắn đã bị xóa", 
                    imageUrl: "",
                    isRead: true 
                } : null 
              };
            }
            return c;
          })
        );
      }
    });

    socket.on(SOCKET_EVENTS.REACTION_UPDATED, ({ messageId, conversationId: reactionConvId, reactions }) => {
      if (selectedIdRef.current === reactionConvId) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...m, reactions } : m
          )
        );
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, (updatedMsg: Message) => {
      console.log("📡 !!! RECEIVED message-updated event:", updatedMsg);
      if (selectedIdRef.current === updatedMsg.conversationId) {
        setMessages((prev) =>
          [...prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))]
        );
      }
      
      // Update sidebar if it's the last message
      setConversations(prev => prev.map(c => 
        c._id === updatedMsg.conversationId && c.lastMessage?._id === updatedMsg._id
          ? { 
              ...c, 
              lastMessage: c.lastMessage ? { 
                  ...c.lastMessage, 
                  text: updatedMsg.text || "",
                  type: updatedMsg.type,
                  imageUrl: updatedMsg.imageUrl,
                  isDeleted: updatedMsg.isDeleted
              } : null 
            }
          : c
      ));
    });
    
    socket.on(SOCKET_EVENTS.USER_BLOCK_UPDATED, (data: any) => {
        // If I'm the blocker, update my blockedUsers list
        if (data.targetId && updateUser && user) {
            updateUser({ ...user, blockedUsers: data.blockedUsers });
        }
        
        // If someone blocked me or unblocked me, I need to refresh the UI
        // We can update the other user's object in the conversation participants
        if (data.updaterId) {
            setConversations(prev => prev.map(c => {
                if (c.isGroup) return c;
                const otherIndex = c.participants.findIndex(p => p._id === data.updaterId);
                if (otherIndex !== -1) {
                    const nextParticipants = [...c.participants];
                    const otherUser = { ...nextParticipants[otherIndex] };
                    
                    if (data.isBlockingMe) {
                        otherUser.blockedUsers = [...(otherUser.blockedUsers || []), user?._id ?? ""];
                    } else {
                        otherUser.blockedUsers = (otherUser.blockedUsers || []).filter(id => id !== user?._id);
                    }
                    
                    nextParticipants[otherIndex] = otherUser;
                    return { ...c, participants: nextParticipants };
                }
                return c;
            }));
        }
    });

    socket.on(SOCKET_EVENTS.USER_UPDATED, (updatedUser: User) => {
      // 1. Update global AuthContext if I am the one who was updated
      if (user?._id === updatedUser._id && updateUser) {
        updateUser(updatedUser);
      }

      // 2. Update conversations list (participants)
      setConversations((prev) =>
        prev.map((conv) => {
          const pIndex = conv.participants.findIndex((p) => p._id === updatedUser._id);
          if (pIndex !== -1) {
            const nextParticipants = [...conv.participants];
            nextParticipants[pIndex] = { ...nextParticipants[pIndex], ...updatedUser };
            return { ...conv, participants: nextParticipants };
          }
          return conv;
        })
      );

      // 3. Update messages history (message sender)
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.sender?._id === updatedUser._id) {
            return {
              ...msg,
              sender: { ...msg.sender, ...updatedUser }
            };
          }
          // Also check forwarded info if applicable
          if (msg.forwardFrom?._id === updatedUser._id) {
            return {
              ...msg,
              forwardFrom: { ...msg.forwardFrom, ...updatedUser }
            };
          }
          return msg;
        })
      );
    });

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
      socket.off(SOCKET_EVENTS.ONLINE_USERS);
      socket.off(SOCKET_EVENTS.TYPING);
      socket.off(SOCKET_EVENTS.STOP_TYPING);
      socket.off(SOCKET_EVENTS.GROUP_UPDATED);
      socket.off(SOCKET_EVENTS.GROUP_DELETED);
      socket.off(SOCKET_EVENTS.CONVERSATION_CLEARED);
      socket.off(SOCKET_EVENTS.CONVERSATION_DELETED);
      socket.off(SOCKET_EVENTS.MESSAGE_READ);
      socket.off(SOCKET_EVENTS.MESSAGES_READ);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED);
      socket.off(SOCKET_EVENTS.REACTION_UPDATED);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED);
      socket.off(SOCKET_EVENTS.USER_BLOCK_UPDATED);
      socket.off(SOCKET_EVENTS.USER_UPDATED);
    };
  }, [user, selectedConversationId]);
};
