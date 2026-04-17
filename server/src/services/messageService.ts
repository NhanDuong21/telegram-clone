import Message, { IMessage } from "../models/Message";
import Conversation from "../models/Conversation";
import { getIO } from "../socket";
import { SOCKET_EVENTS } from "../utils/socketEvents";

export const sendMessageService = async (
    conversationId: string,
    senderId: string,
    text?: string,
    imageUrl?: string,
    replyTo?: string,
    forwardFrom?: string,
    type: 'text' | 'image' | 'video' | 'voice' | 'system' = 'text',
    imageUrls?: string[],
    videoUrl?: string,
    videoDuration?: number,
    videoWidth?: number,
    videoHeight?: number,
    videoUrls?: string[],
    videoDurations?: number[]
) => {
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
        videoUrl: videoUrl ? videoUrl.trim() : "",
        videoDuration,
        videoWidth,
        videoHeight,
        imageUrls: imageUrls || [],
        videoUrls: videoUrls || [],
        videoDurations: videoDurations || [],
        readBy: [senderId],
        isRead: false,
        replyTo: replyTo || undefined,
        forwardFrom: forwardFrom || undefined,
        type,
    });

    // 1. Emit ngay lập tức sau khi tạo xong Message (Không đợi update Conversation)
    const populated = await newMessage.populate([
        { path: "sender", select: "username avatar email fullName" },
        {
            path: "replyTo",
            populate: { path: "sender", select: "username fullName" },
            select: "text imageUrl sender"
        },
        { path: "forwardFrom", select: "username avatar fullName" }
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

export const getMessagesService = async (conversationId: string, userId: string, page: number = 1, limit: number = 30) => {
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

    const messages = await Message.find(query)
        .populate("sender", "username avatar fullName")
        .populate({
            path: "replyTo",
            populate: { path: "sender", select: "username fullName" },
            select: "text imageUrl sender"
        })
        .populate("forwardFrom", "username avatar fullName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
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
        .populate("sender", "username avatar fullName")
        .populate({
            path: "replyTo",
            populate: { path: "sender", select: "username fullName" },
            select: "text imageUrl sender"
        })
        .populate("forwardFrom", "username avatar fullName")
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

import mongoose from "mongoose";

export const getSharedMediaService = async (conversationId: string, userId: string, type: string, before?: string, limit: number = 30) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    }).select("_id").lean();

    if (!conversation) {
        throw new Error("Conversation không tồn tại");
    }

    const query: any = {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        deletedFor: { $ne: new mongoose.Types.ObjectId(userId) },
        isDeleted: { $ne: true }
    };

    if (type === 'image') {
        query.$or = [
            { type: 'image' },
            { imageUrl: { $ne: "" } },
            { imageUrls: { $exists: true, $not: { $size: 0 } } }
        ];
    } else if (type === 'video') {
        query.type = 'video';
    }

    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
        .select("imageUrl imageUrls videoUrl videoUrls videoDuration videoDurations createdAt type")
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean();

    const hasMore = messages.length > limit;
    if (hasMore) {
        messages.pop();
    }

    // Flatten media items
    const flattenedMedia: any[] = [];
    messages.forEach(msg => {
        if (msg.type === 'video') {
            if (msg.videoUrls && msg.videoUrls.length > 0) {
                msg.videoUrls.forEach((url: string, idx: number) => {
                    const duration = (msg.videoDurations && msg.videoDurations[idx]) || (idx === 0 ? msg.videoDuration : 0);
                    flattenedMedia.push({ _id: msg._id, imageUrl: url, createdAt: msg.createdAt, type: 'video', duration });
                });
            } else if (msg.videoUrl) {
                flattenedMedia.push({ _id: msg._id, imageUrl: msg.videoUrl, createdAt: msg.createdAt, type: 'video', duration: msg.videoDuration });
            }
        } else if (msg.imageUrls && msg.imageUrls.length > 0) {
            msg.imageUrls.forEach((url: string) => {
                flattenedMedia.push({ _id: msg._id, imageUrl: url, createdAt: msg.createdAt, type: 'image' });
            });
        } else if (msg.imageUrl) {
            flattenedMedia.push({ _id: msg._id, imageUrl: msg.imageUrl, createdAt: msg.createdAt, type: 'image' });
        }
    });

    // Comprehensive Stats using aggregation
    const statsAggregation = await Message.aggregate([
        {
            $match: {
                conversationId: new mongoose.Types.ObjectId(conversationId),
                deletedFor: { $ne: new mongoose.Types.ObjectId(userId) },
                isDeleted: { $ne: true }
            }
        },
        {
            $group: {
                _id: "$type",
                messageCount: { $sum: 1 },
                // For images, we need to count individual files in albums
                albumPhotoCount: {
                    $sum: {
                        $cond: [
                            { $and: [{ $isArray: "$imageUrls" }, { $gt: [{ $size: "$imageUrls" }, 0] }] },
                            { $size: "$imageUrls" },
                            { $cond: [{ $and: [{ $eq: ["$type", "image"] }, { $gt: ["$imageUrl", ""] }] }, 1, 0] }
                        ]
                    }
                },
                albumVideoCount: {
                    $sum: {
                        $cond: [
                            { $and: [{ $isArray: "$videoUrls" }, { $gt: [{ $size: "$videoUrls" }, 0] }] },
                            { $size: "$videoUrls" },
                            { $cond: [{ $and: [{ $eq: ["$type", "video"] }, { $gt: ["$videoUrl", ""] }] }, 1, 0] }
                        ]
                    }
                }
            }
        }
    ]);

    const stats = {
        image: 0,
        video: 0,
        file: 0,
        voice: 0
    };

    statsAggregation.forEach(item => {
        if (item._id === 'image') stats.image = item.albumPhotoCount;
        else if (item._id === 'video') stats.video = item.albumVideoCount;
        else if (item._id === 'voice') stats.voice = item.messageCount;
        // Add more types if needed
    });

    // Backward compatibility for totalCount
    const totalCount = type === 'image' ? stats.image : (type === 'video' ? stats.video : 0);

    return { media: flattenedMedia, hasMore, totalCount, stats };
};

export const removeFileService = async (messageId: string, userId: string, fileUrl: string, type: 'one-way' | 'two-way' = 'two-way') => {
    const message = await Message.findOne({ _id: messageId });
    if (!message) throw new Error("Tin nhắn không tồn tại");

    if (type === 'one-way') {
        const userIdObj = new mongoose.Types.ObjectId(userId);
        if (!message.deletedFor.includes(userIdObj)) {
            message.deletedFor.push(userIdObj);
            await message.save();
        }

        const io = getIO();
        io.to(userId).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
            messageId,
            conversationId: message.conversationId,
            type: 'one-way',
            userId
        });

        return { deleted: true, type: 'one-way' };
    }

    // Two-way deletion logic (Editing the actual message)
    if (message.sender.toString() !== userId) {
        throw new Error("Chỉ người gửi mới có thể xóa ảnh khỏi album cho mọi người");
    }

    let isModified = false;

    // Handle imageUrls array
    if (message.imageUrls && message.imageUrls.length > 0) {
        const originalLength = message.imageUrls.length;
        message.imageUrls = message.imageUrls.filter(url => url !== fileUrl);
        if (message.imageUrls.length !== originalLength) {
            isModified = true;
            // Also update legacy imageUrl if it was pointing to the deleted file
            if (message.imageUrl === fileUrl) {
                message.imageUrl = message.imageUrls.length > 0 ? message.imageUrls[0] : "";
            }
        }
    } else if (message.imageUrl === fileUrl) {
        message.imageUrl = "";
        isModified = true;
    }

    if (!isModified) {
        throw new Error("Không tìm thấy tệp đính kèm để xóa");
    }

    const remainingImages = (message.imageUrls && message.imageUrls.length > 0)
        ? message.imageUrls.length
        : (message.imageUrl && message.imageUrl.trim() !== "" ? 1 : 0);

    const hasContent = remainingImages > 0 || (message.text && message.text.trim() !== "");

    const io = getIO();
    const conversation = await Conversation.findById(message.conversationId).select("participants").lean();

    if (!hasContent) {
        // Instead of deleting, mark it as deleted to keep conversation history
        message.isDeleted = true;
        message.text = "Tin nhắn đã bị xóa";
        message.imageUrl = "";
        message.imageUrls = [];
        await message.save();

        if (conversation) {
            conversation.participants.forEach((p: any) => {
                io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
                    messageId,
                    conversationId: message.conversationId.toString(),
                    type: 'two-way'
                });
            });
        }
        return { deleted: true, message };
    } else {
        await message.save();
        const updatedMsg = await Message.findById(messageId).populate("sender", "username fullName avatar");

        if (conversation && updatedMsg) {
            console.log(`📡 Emitting MESSAGE_UPDATED for album ${messageId} to participants`);
            conversation.participants.forEach((p: any) => {
                io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.MESSAGE_UPDATED, updatedMsg);
            });
        }
        return { deleted: false, message: updatedMsg };
    }
};
