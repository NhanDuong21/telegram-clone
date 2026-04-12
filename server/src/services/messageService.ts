import Message, { IMessage } from "../models/Message";
import Conversation from "../models/Conversation";
import { getIO } from "../socket";
import { SOCKET_EVENTS } from "../utils/socketEvents";

export const sendMessageService = async (conversationId: string, senderId: string, text?: string, imageUrl?: string) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: senderId,
    });

    if (!conversation) {
        throw new Error("Conversation không tồn tại");
    }

    const newMessage = await Message.create({
        conversationId,
        sender: senderId,
        text: text ? text.trim() : "",
        imageUrl: imageUrl ? imageUrl.trim() : "",
        readBy: [senderId],
        isRead: false,
    });

    // 1. Emit ngay lập tức sau khi tạo xong Message (Không đợi update Conversation)
    const populated = await newMessage.populate("sender", "username avatar email");
    const io = getIO();
    
    // Broadcast message ngay (Non-blocking)
    conversation.participants.forEach((p) => {
        io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, populated);
    });

    // 2. Chạy update Conversation ngầm trong background (Giảm độ trễ cho recipient)
    Conversation.findByIdAndUpdate(conversationId, { 
        lastMessage: newMessage._id,
        updatedAt: new Date()
    }).exec().catch(err => console.error("Async lastMessage update failed:", err));

    return populated;
};

export const getMessagesService = async (conversationId: string, userId: string, before?: string, limit: number = 30) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    }).select("_id").lean();

    if (!conversation) {
        throw new Error("Conversation không tồn tại");
    }

    const query: { conversationId: string; createdAt?: { $lt: Date } } = { conversationId };
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
        .populate("sender", "username avatar")
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean();

    const hasMore = messages.length > limit;
    if (hasMore) {
        messages.pop();
    }

    messages.reverse();
    return { messages, hasMore };
};

export const markAsReadService = async (conversationId: string, userId: string) => {
    // Update all messages in this conversation where user is NOT the sender and isRead is false
    await Message.updateMany(
        { 
            conversationId, 
            sender: { $ne: userId }, 
            readBy: { $ne: userId } 
        },
        { 
            $set: { isRead: true },
            $addToSet: { readBy: userId }
        }
    );
    
    const io = getIO();
    const conversation = await Conversation.findById(conversationId).select("participants").lean();
    if (conversation) {
        conversation.participants.forEach((p) => {
            io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.MESSAGES_READ, { conversationId, readerId: userId });
        });
    }
};
