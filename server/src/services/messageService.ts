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
    });

    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: newMessage._id });

    const populated = await newMessage.populate("sender", "-password");

    const io = getIO();
    conversation.participants.forEach((p) => {
        io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, populated);
    });

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

export const markAsReadService = async (messageId: string, conversationId: string, userId: string) => {
    await Message.findByIdAndUpdate(messageId, {
        $addToSet: { readBy: userId }
    });
    
    const io = getIO();
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
        conversation.participants.forEach((p) => {
            io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.MESSAGE_READ, { messageId, userId, conversationId });
        });
    }
};
