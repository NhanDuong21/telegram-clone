import Message from "../models/Message";
import Conversation from "../models/Conversation";
import { getIO } from "../socket";

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

    conversation.lastMessage = newMessage._id;
    await conversation.save();

    const populated = await newMessage.populate("sender", "-password");

    const io = getIO();
    io.to(conversationId).emit("receiveMessage", populated);

    return populated;
};

export const getMessagesService = async (conversationId: string, userId: string, before?: string, limit: number = 30) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    });

    if (!conversation) {
        throw new Error("Conversation không tồn tại");
    }

    const query: any = { conversationId };
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
        .populate("sender", "-password")
        .sort({ createdAt: -1 })
        .limit(limit + 1);

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
    io.to(conversationId).emit("messageRead", { messageId, userId, conversationId });
};
