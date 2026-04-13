import Message, { IMessage } from "../models/Message";
import Conversation from "../models/Conversation";
import { getIO } from "../socket";
import { SOCKET_EVENTS } from "../utils/socketEvents";

export const sendMessageService = async (conversationId: string, senderId: string, text?: string, imageUrl?: string, replyTo?: string, forwardFrom?: string, type: 'text' | 'image' | 'voice' | 'system' = 'text') => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: senderId,
    });

    if (!conversation) {
        throw new Error("Conversation không tồn tại");
    }

    // Kiểm tra chặn nếu là chat 1-1
    if (!conversation.isGroup && type !== 'system') {
        const User = (await import("../models/User")).default;
        const recipientId = conversation.participants.find(p => p.toString() !== senderId);
        
        if (recipientId) {
            const users = await User.find({
                _id: { $in: [senderId, recipientId] }
            });

            const sender = users.find(u => u._id.toString() === senderId);
            const recipient = users.find(u => u._id.toString() === recipientId.toString());

            if (sender?.blockedUsers.some(id => id.toString() === recipientId.toString())) {
                throw new Error("Bạn đã chặn người dùng này");
            }
            if (recipient?.blockedUsers.some(id => id.toString() === senderId)) {
                throw new Error("Bạn đã bị chặn bởi người dùng này");
            }
        }
    }

    const newMessage = await Message.create({
        conversationId,
        sender: senderId,
        text: text ? text.trim() : "",
        imageUrl: imageUrl ? imageUrl.trim() : "",
        readBy: [senderId],
        isRead: false,
        replyTo: replyTo || undefined,
        forwardFrom: forwardFrom || undefined,
        type,
    });

    // 1. Emit ngay lập tức sau khi tạo xong Message (Không đợi update Conversation)
    const populated = await newMessage.populate([
        { path: "sender", select: "username avatar email" },
        { 
            path: "replyTo", 
            populate: { path: "sender", select: "username" },
            select: "text imageUrl sender"
        },
        { path: "forwardFrom", select: "username avatar" }
    ]);
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

    const query: any = { 
        conversationId,
        deletedFor: { $ne: userId }
    };
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
        .populate("sender", "username avatar")
        .populate({
            path: "replyTo",
            populate: { path: "sender", select: "username" },
            select: "text imageUrl sender"
        })
        .populate("forwardFrom", "username avatar")
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

export const deleteMessageService = async (messageId: string, userId: string, type: 'one-way' | 'two-way') => {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Tin nhắn không tồn tại");

    if (type === 'two-way') {
        if (message.sender.toString() !== userId) {
            throw new Error("Bạn không có quyền xóa tin nhắn này cho mọi người");
        }
        
        // Two-way delete: Clear content and set flag
        message.text = "Tin nhắn đã bị xóa";
        message.imageUrl = "";
        message.isDeleted = true;
        await message.save();
    } else {
        // One-way delete: Add to deletedFor
        if (!message.deletedFor.includes(userId as any)) {
            message.deletedFor.push(userId as any);
            await message.save();
        }
    }

    const io = getIO();
    const conversation = await Conversation.findById(message.conversationId).select("participants").lean();
    
    if (conversation) {
        conversation.participants.forEach((p) => {
            io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, { 
                messageId, 
                conversationId: message.conversationId.toString(),
                type,
                userId // Who triggered the delete
            });
        });
    }

    return message;
};

export const sendReactionService = async (messageId: string, userId: string, emoji: string) => {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Tin nhắn không tồn tại");

    const existingIndex = message.reactions.findIndex(
        (r) => r.user.toString() === userId && r.emoji === emoji
    );

    if (existingIndex !== -1) {
        // Toggle off
        message.reactions.splice(existingIndex, 1);
    } else {
        // Remove old reaction from same user if exists (Telegram usually allows only 1 reaction per user)
        const userReactionIndex = message.reactions.findIndex(
            (r) => r.user.toString() === userId
        );
        if (userReactionIndex !== -1) {
            message.reactions.splice(userReactionIndex, 1);
        }
        // Add new
        message.reactions.push({ user: userId as any, emoji });
    }

    await message.save();

    const io = getIO();
    const conversation = await Conversation.findById(message.conversationId).select("participants").lean();
    if (conversation) {
        conversation.participants.forEach((p) => {
            io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.REACTION_UPDATED, {
                messageId,
                conversationId: message.conversationId.toString(),
                reactions: message.reactions
            });
        });
    }

    return message.reactions;
};

export const updateMessageService = async (messageId: string, userId: string, data: { text?: string, isPinned?: boolean, pinForBoth?: boolean }) => {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Tin nhắn không tồn tại");

    if (data.text !== undefined) {
        if (message.sender.toString() !== userId) {
            throw new Error("Bạn không có quyền sửa tin nhắn này");
        }
        message.text = data.text.trim();
        message.isEdited = true;
    }

    let shouldBroadcastGlobally = (data.text !== undefined);

    if (data.isPinned !== undefined) {
        if (data.isPinned) {
            if (data.pinForBoth) {
                message.isPinned = true;
                shouldBroadcastGlobally = true;
            } else {
                if (!message.pinnedFor.includes(userId as any)) {
                    message.pinnedFor.push(userId as any);
                }
                // No global broadcast for local pin
            }
        } else {
            // Unpinning
            if (message.isPinned) {
                // If it was global, unpinning makes it unpinned for everyone
                message.isPinned = false;
                shouldBroadcastGlobally = true;
            }
            // Always remove from local pins too
            message.pinnedFor = message.pinnedFor.filter(id => id.toString() !== userId);
        }
    }

    await message.save();

    const populated = await Message.findById(messageId)
        .populate("sender", "username avatar")
        .populate({
            path: "replyTo",
            populate: { path: "sender", select: "username" },
            select: "text imageUrl sender"
        })
        .populate("forwardFrom", "username avatar")
        .lean();

    const io = getIO();
    const conversation = await Conversation.findById(message.conversationId).select("participants").lean();
    
    if (conversation) {
        if (shouldBroadcastGlobally) {
            conversation.participants.forEach((p) => {
                io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.MESSAGE_UPDATED, populated);
            });
        } else {
            // Local pin update: only send to the actor
            io.to(`user_${userId}`).emit(SOCKET_EVENTS.MESSAGE_UPDATED, populated);
        }
    }

    return populated;
};

export const markAsReadService = async (conversationId: string, userId: string) => {
    // 1. Bulk update in DB: mark all messages as read by this user
    const result = await Message.updateMany(
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

    if (result.modifiedCount > 0) {
        const io = getIO();
        const conversation = await Conversation.findById(conversationId).select("participants").lean();
        
        if (conversation) {
            conversation.participants.forEach((p) => {
                io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.MESSAGES_READ, { 
                    conversationId, 
                    readerId: userId 
                });
            });
        }
    }
};
