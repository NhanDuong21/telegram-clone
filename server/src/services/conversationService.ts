import mongoose from "mongoose";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import User from "../models/User";
import { getIO } from "../socket";
import { SOCKET_EVENTS } from "../utils/socketEvents";
import { IUser } from "../models/User";

export const createGroupService = async (name: string, participantIds: string[], ownerId: string) => {
    const allParticipants = new Set([...participantIds, ownerId]);

    if (allParticipants.size < 3) {
        throw new Error("Group phải có ít nhất 3 thành viên");
    }

    const newGroup = await Conversation.create({
        isGroup: true,
        name: name.trim(),
        participants: Array.from(allParticipants),
        owner: new mongoose.Types.ObjectId(ownerId)
    });

    const populated = await newGroup.populate("participants", "-password");

    // Notify all participants so the group appears in their sidebar instantly
    const io = getIO();
    (populated.participants as unknown as IUser[]).forEach((p) => {
        io.to(`user_${p._id.toString()}`).emit(SOCKET_EVENTS.GROUP_UPDATED, populated);
    });

    return populated;
};

export const updateGroupSettingsService = async (
    id: string, 
    userId: string, 
    data: { 
        name?: string; 
        imageUrl?: string; 
        description?: string; 
        showHistoryForNewMembers?: boolean; 
        permissions?: any 
    }
) => {
    const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
    if (!conversation) throw new Error("Group không tồn tại hoặc bạn không có quyền");

    if (data.name !== undefined) {
        if (data.name.trim() === "") throw new Error("Tên group không hợp lệ");
        conversation.name = data.name.trim();
    }
    if (data.imageUrl !== undefined) {
        conversation.imageUrl = data.imageUrl.trim();
    }
    if (data.description !== undefined) {
        conversation.description = data.description.trim();
    }
    if (data.showHistoryForNewMembers !== undefined) {
        conversation.showHistoryForNewMembers = data.showHistoryForNewMembers;
    }
    if (data.permissions !== undefined) {
        conversation.permissions = {
            ...conversation.permissions,
            ...data.permissions
        };
    }

    await conversation.save();
    const populated = await conversation.populate("participants", "-password");

    const io = getIO();
    (populated.participants as unknown as IUser[]).forEach((p) => {
        io.to(`user_${p._id.toString()}`).emit(SOCKET_EVENTS.GROUP_UPDATED, populated);
    });

    return populated;
};

export const addMembersService = async (id: string, userId: string, participantIds: string[]) => {
    const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
    if (!conversation) throw new Error("Group không tồn tại hoặc bạn không có quyền");

    const currentIds = conversation.participants.map((p) => p.toString());
    const addedUserIds = participantIds.filter(pid => !currentIds.includes(pid));
    
    if (addedUserIds.length === 0) return conversation;

    conversation.participants = [...currentIds, ...addedUserIds] as any[];
    await conversation.save();
    
    const populated = await conversation.populate("participants", "-password");

    // Fetch details for system message
    const adder = await User.findById(userId);
    const addedUsers = await User.find({ _id: { $in: addedUserIds } });

    const io = getIO();

    // Create system messages
    for (const addedUser of addedUsers) {
        const systemText = `${adder?.fullName || adder?.username} đã thêm ${addedUser.fullName || addedUser.username} vào nhóm`;
        const systemMsg = await Message.create({
            conversationId: id,
            sender: userId, // The person who performed the action
            text: systemText,
            type: 'system'
        });

        const populatedMsg = await systemMsg.populate("sender", "username fullName avatar");
        
        // Broadcast system message to all room members
        io.to(id.toString()).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, populatedMsg);
    }

    // Update the group list for all participants
    populated.participants.forEach((p: any) => {
        io.to(`user_${p._id.toString()}`).emit(SOCKET_EVENTS.GROUP_UPDATED, populated);
    });

    return populated;
};

export const removeMemberService = async (id: string, userId: string, memberId: string) => {
    const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
    if (!conversation) throw new Error("Group không tồn tại hoặc bạn không có quyền");

    if (conversation.owner && conversation.owner.toString() !== userId) {
        throw new Error("Chỉ Group Owner mới có quyền kick thành viên");
    }

    if (memberId === conversation.owner?.toString()) {
        throw new Error("Không thể kick Group Owner");
    }

    const currentIds = conversation.participants.map((p: any) => p.toString());
    if (!currentIds.includes(memberId)) throw new Error("Member không có trong group");

    if (currentIds.length <= 3) throw new Error("Group phải có ít nhất 3 người. Không thể kick thêm.");

    conversation.participants = currentIds.filter(pid => pid !== memberId) as any[];
    await conversation.save();

    const populated = await conversation.populate("participants", "-password");

    // Create system message for kick notification
    const kicker = await User.findById(userId);
    const kickedUser = await User.findById(memberId);
    const systemText = `${kicker?.fullName || kicker?.username} đã xóa ${kickedUser?.fullName || kickedUser?.username} khỏi nhóm`;
    const systemMsg = await Message.create({
        conversationId: id,
        sender: userId,
        text: systemText,
        type: 'system'
    });
    const populatedMsg = await systemMsg.populate("sender", "username fullName avatar");

    const io = getIO();
    // Broadcast system message to remaining members
    io.to(id.toString()).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, populatedMsg);

    (populated.participants as unknown as IUser[]).forEach((p) => {
        io.to(`user_${p._id.toString()}`).emit(SOCKET_EVENTS.GROUP_UPDATED, populated);
    });
    // Notify the kicked member separately
    io.to(`user_${memberId}`).emit(SOCKET_EVENTS.MEMBER_KICKED, { conversationId: id, kickedUserId: memberId });

    return populated;
};

export const deleteGroupService = async (id: string, userId: string) => {
    const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
    if (!conversation) throw new Error("Group không tồn tại hoặc bạn không có quyền");

    if (conversation.owner && conversation.owner.toString() !== userId) {
        throw new Error("Chỉ Group Owner mới có quyền xóa vĩnh viễn nhóm");
    }

    const participantIds = conversation.participants.map(p => p.toString());

    await Message.deleteMany({ conversationId: id });
    await Conversation.findByIdAndDelete(id);

    const io = getIO();
    participantIds.forEach(p => {
        io.to(`user_${p}`).emit(SOCKET_EVENTS.GROUP_DELETED, { conversationId: id });
    });

    return id;
};

export const leaveGroupService = async (id: string, userId: string) => {
    const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
    if (!conversation) throw new Error("Group không tồn tại hoặc bạn không phải thành viên");

    const currentIds = conversation.participants.map((p: any) => p.toString());
    const remaining = currentIds.filter(pid => pid !== userId);

    // If group drops below 3, auto-delete
    if (remaining.length < 3) {
        await Message.deleteMany({ conversationId: id });
        await Conversation.findByIdAndDelete(id);

        const io = getIO();
        currentIds.forEach(p => {
            io.to(`user_${p}`).emit(SOCKET_EVENTS.GROUP_DELETED, { conversationId: id });
        });
        return { deleted: true, conversationId: id };
    }

    // Transfer ownership if the owner is leaving
    if (conversation.owner && conversation.owner.toString() === userId) {
        const newOwner = remaining[0];
        conversation.owner = new mongoose.Types.ObjectId(newOwner);
    }

    conversation.participants = remaining as any[];
    await conversation.save();

    const populated = await conversation.populate("participants", "-password");

    const io = getIO();
    (populated.participants as unknown as IUser[]).forEach((p) => {
        io.to(`user_${p._id.toString()}`).emit(SOCKET_EVENTS.GROUP_UPDATED, populated);
    });
    // Notify the user who left
    io.to(`user_${userId}`).emit(SOCKET_EVENTS.MEMBER_LEFT, { conversationId: id, userId });

    return { deleted: false, conversation: populated };
};

export const createOrGetConversationService = async (senderId: string, receiverId: string) => {
    if (senderId === receiverId) throw new Error("Không thể chat với chính mình");

    const existingConversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId], $size: 2 },
    }).populate("participants", "username email avatar fullName").lean();

    if (existingConversation) return existingConversation;

    const newConversation = await Conversation.create({
        participants: [senderId, receiverId],
    });

    return await newConversation.populate("participants", "-password");
};

export const getMyConversationsService = async (userId: string) => {
    const conversations = await Conversation.find({
        participants: userId,
    })
    .populate("participants", "username email avatar fullName")
    .populate("lastMessage", "text imageUrl type isDeleted createdAt isRead")
    .sort({ updatedAt: -1 })
    .lean();

    const withUnread = await Promise.all(conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
            conversationId: conv._id,
            sender: { $ne: userId },
            readBy: { $ne: userId }
        });
        return { ...conv, unreadCount };
    }));

    return withUnread;
};

export const clearChatService = async (id: string, userId: string, deleteForBoth: boolean = false) => {
    const conversation = await Conversation.findOne({ _id: id, participants: userId });
    if (!conversation) throw new Error("Conversation không tồn tại hoặc bạn không có quyền");

    if (deleteForBoth || conversation.isGroup) {
        await Message.deleteMany({ conversationId: id });
        conversation.lastMessage = undefined;
        await conversation.save();
        
        const io = getIO();
        conversation.participants.forEach(p => {
            io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.CONVERSATION_CLEARED, { conversationId: id });
        });
    } else {
        // 1-way delete: For now, just trigger local UI clear for the user
        const io = getIO();
        io.to(`user_${userId}`).emit(SOCKET_EVENTS.CONVERSATION_CLEARED, { conversationId: id });
    }

    return id;
};

export const deleteConversationService = async (id: string, userId: string, deleteForBoth: boolean = false) => {
    const conversation = await Conversation.findOne({ _id: id, participants: userId });
    if (!conversation) throw new Error("Chat không tồn tại hoặc bạn không có quyền");

    if (deleteForBoth || conversation.isGroup) {
        await Message.deleteMany({ conversationId: id });
        await Conversation.findByIdAndDelete(id);

        const io = getIO();
        conversation.participants.forEach(p => {
            io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.CONVERSATION_DELETED, { conversationId: id });
        });
    } else {
        // 1-way delete: For now, just trigger local UI removal for the user
        const io = getIO();
        io.to(`user_${userId}`).emit(SOCKET_EVENTS.CONVERSATION_DELETED, { conversationId: id });
    }

    return id;
};
