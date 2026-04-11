import mongoose from "mongoose";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
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

    return await newGroup.populate("participants", "-password");
};

export const updateGroupSettingsService = async (id: string, userId: string, data: { name?: string, imageUrl?: string }) => {
    const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
    if (!conversation) throw new Error("Group không tồn tại hoặc bạn không có quyền");

    if (conversation.owner && conversation.owner.toString() !== userId) {
        throw new Error("Chỉ Group Owner mới có quyền thay đổi thông tin nhóm");
    }

    if (data.name !== undefined) {
        if (data.name.trim() === "") throw new Error("Tên group không hợp lệ");
        conversation.name = data.name.trim();
    }
    if (data.imageUrl !== undefined) {
        conversation.imageUrl = data.imageUrl.trim();
    }

    await conversation.save();
    const populated = await conversation.populate("participants", "-password");

    const io = getIO();
    (populated.participants as unknown as IUser[]).forEach((p) => {
        io.to(p._id.toString()).emit(SOCKET_EVENTS.GROUP_UPDATED, populated);
    });

    return populated;
};

export const addMembersService = async (id: string, userId: string, participantIds: string[]) => {
    const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
    if (!conversation) throw new Error("Group không tồn tại hoặc bạn không có quyền");

    if (conversation.owner && conversation.owner.toString() !== userId) {
        throw new Error("Chỉ Group Owner mới có quyền thêm thành viên");
    }

    const currentIds = conversation.participants.map((p) => p.toString());
    const newSet = new Set([...currentIds, ...participantIds]);

    conversation.participants = Array.from(newSet) as any[];
    await conversation.save();
    
    const populated = await conversation.populate("participants", "-password");

    const io = getIO();
    (populated.participants as unknown as IUser[]).forEach((p) => {
        io.to(p._id.toString()).emit(SOCKET_EVENTS.GROUP_UPDATED, populated);
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

    const io = getIO();
    (populated.participants as unknown as IUser[]).forEach((p) => {
        io.to(p._id.toString()).emit(SOCKET_EVENTS.GROUP_UPDATED, populated);
    });
    io.to(memberId).emit(SOCKET_EVENTS.GROUP_UPDATED, populated);

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
        io.to(p).emit(SOCKET_EVENTS.GROUP_DELETED, { conversationId: id });
    });

    return id;
};

export const createOrGetConversationService = async (senderId: string, receiverId: string) => {
    if (senderId === receiverId) throw new Error("Không thể chat với chính mình");

    const existingConversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId], $size: 2 },
    }).populate("participants", "-password");

    if (existingConversation) return existingConversation;

    const newConversation = await Conversation.create({
        participants: [senderId, receiverId],
    });

    return await newConversation.populate("participants", "-password");
};

export const getMyConversationsService = async (userId: string) => {
    return await Conversation.find({
        participants: userId,
    })
    .populate("participants", "-password")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });
};

export const clearChatService = async (id: string, userId: string) => {
    const conversation = await Conversation.findOne({ _id: id, participants: userId });
    if (!conversation) throw new Error("Conversation không tồn tại hoặc bạn không có quyền");

    await Message.deleteMany({ conversationId: id });
    
    conversation.lastMessage = undefined;
    await conversation.save();

    const io = getIO();
    conversation.participants.forEach(p => {
        io.to(p.toString()).emit(SOCKET_EVENTS.CONVERSATION_CLEARED, { conversationId: id });
    });

    return id;
};

export const deleteConversationService = async (id: string, userId: string) => {
    const conversation = await Conversation.findOne({ _id: id, isGroup: false, participants: userId });
    if (!conversation) throw new Error("Chat không tồn tại, bạn không có quyền, hoặc đây là Group Chat");

    await Message.deleteMany({ conversationId: id });
    await Conversation.findByIdAndDelete(id);

    const io = getIO();
    conversation.participants.forEach(p => {
        io.to(p.toString()).emit(SOCKET_EVENTS.CONVERSATION_DELETED, { conversationId: id });
    });

    return id;
};
