import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import { getIO } from "../socket";

// POST /api/conversations/group
// Body: { name: string, participantIds: string[] }
// Tạo một group chat mới
export const createGroupConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { name, participantIds } = req.body;
        const senderId = req.user._id.toString();

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Tên nhóm là bắt buộc" });
        }

        if (!participantIds || !Array.isArray(participantIds)) {
            return res.status(400).json({ message: "participantIds phải là một array" });
        }

        // Đảm bảo không duplicate và current user luôn là một thành viên
        const allParticipants = new Set([...participantIds, senderId]);

        if (allParticipants.size < 3) {
            return res.status(400).json({ message: "Group phải có ít nhất 3 thành viên" });
        }

        const newGroup = await Conversation.create({
            isGroup: true,
            name: name.trim(),
            participants: Array.from(allParticipants),
            owner: new mongoose.Types.ObjectId(senderId)
        });

        const populated = await newGroup.populate("participants", "-password");

        return res.status(201).json({ conversation: populated });
    } catch (error) {
        console.error("Create group error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateGroupSettings = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, imageUrl } = req.body;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
        if (!conversation) return res.status(404).json({ message: "Group không tồn tại hoặc bạn không có quyền" });

        if (conversation.owner && conversation.owner.toString() !== userId) {
            return res.status(403).json({ message: "Chỉ Group Owner mới có quyền thay đổi thông tin nhóm" });
        }

        if (name !== undefined) {
            if (name.trim() === "") return res.status(400).json({ message: "Tên group không hợp lệ" });
            conversation.name = name.trim();
        }
        if (imageUrl !== undefined) {
            conversation.imageUrl = imageUrl.trim();
        }

        await conversation.save();
        const populated = await conversation.populate("participants", "-password");

        const io = getIO();
        populated.participants.forEach((p: any) => {
            io.to(p._id.toString()).emit("groupUpdated", populated);
        });

        return res.status(200).json({ conversation: populated });
    } catch (error) {
        console.error("Update group error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const addMembers = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { participantIds } = req.body;
        const userId = req.user._id.toString();

        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ message: "Danh sách member không hợp lệ" });
        }

        const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
        if (!conversation) return res.status(404).json({ message: "Group không tồn tại hoặc bạn không có quyền" });

        if (conversation.owner && conversation.owner.toString() !== userId) {
            return res.status(403).json({ message: "Chỉ Group Owner mới có quyền thêm thành viên" });
        }

        const currentIds = conversation.participants.map((p: any) => p.toString());
        const newSet = new Set([...currentIds, ...participantIds]);

        conversation.participants = Array.from(newSet) as any;
        await conversation.save();
        
        const populated = await conversation.populate("participants", "-password");

        const io = getIO();
        populated.participants.forEach((p: any) => {
            io.to(p._id.toString()).emit("groupUpdated", populated);
        });

        return res.status(200).json({ conversation: populated });
    } catch (error) {
        console.error("Add members error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
        if (!conversation) return res.status(404).json({ message: "Group không tồn tại hoặc bạn không có quyền" });

        if (conversation.owner && conversation.owner.toString() !== userId) {
            return res.status(403).json({ message: "Chỉ Group Owner mới có quyền kick thành viên" });
        }

        if (memberId === conversation.owner?.toString()) {
            return res.status(400).json({ message: "Không thể kick Group Owner" });
        }

        const currentIds = conversation.participants.map((p: any) => p.toString());
        if (!currentIds.includes(memberId)) {
            return res.status(400).json({ message: "Member không có trong group" });
        }

        if (currentIds.length <= 3) {
            return res.status(400).json({ message: "Group phải có ít nhất 3 người. Không thể kick thêm." });
        }

        conversation.participants = currentIds.filter(pid => pid !== memberId) as any;
        await conversation.save();

        const populated = await conversation.populate("participants", "-password");

        const io = getIO();
        populated.participants.forEach((p: any) => {
            io.to(p._id.toString()).emit("groupUpdated", populated);
        });
        
        // Important: also emit to the member who was just removed!
        io.to(memberId).emit("groupUpdated", populated);

        return res.status(200).json({ conversation: populated });
    } catch (error) {
        console.error("Remove member error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const deleteGroupConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findOne({ _id: id, isGroup: true, participants: userId });
        if (!conversation) return res.status(404).json({ message: "Group không tồn tại hoặc bạn không có quyền" });

        // Only group owner can delete
        if (conversation.owner && conversation.owner.toString() !== userId) {
            return res.status(403).json({ message: "Chỉ Group Owner mới có quyền xóa vĩnh viễn nhóm" });
        }

        const participantIds = conversation.participants.map(p => p.toString());

        // Delete all grouped messages and the group itself
        await Message.deleteMany({ conversationId: id });
        await Conversation.findByIdAndDelete(id);

        const io = getIO();
        participantIds.forEach(p => {
            io.to(p).emit("groupDeleted", { conversationId: id });
        });

        return res.status(200).json({ message: "Xóa group thành công", deletedConversationId: id });
    } catch (error) {
        console.error("Delete group error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// POST /api/conversations
// Body: { receiverId }
// Tạo conversation mới hoặc trả về conversation đã tồn tại
export const createOrGetConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user._id;

        if (!receiverId) {
            return res.status(400).json({ message: "receiverId là bắt buộc" });
        }

        // Không cho tạo conversation với chính mình
        if (senderId.toString() === receiverId) {
            return res.status(400).json({ message: "Không thể chat với chính mình" });
        }

        // Tìm conversation đã tồn tại giữa 2 user
        const existingConversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId], $size: 2 },
        }).populate("participants", "-password");

        if (existingConversation) {
            return res.status(200).json({ conversation: existingConversation });
        }

        // Tạo conversation mới
        const newConversation = await Conversation.create({
            participants: [senderId, receiverId],
        });

        // Populate participants trước khi trả về
        const populated = await newConversation.populate("participants", "-password");

        return res.status(201).json({ conversation: populated });
    } catch (error) {
        console.error("Create conversation error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// GET /api/conversations
// Lấy tất cả conversations của user hiện tại, sắp xếp theo tin nhắn mới nhất
export const getMyConversations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate("participants", "-password")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        return res.status(200).json({ conversations });
    } catch (error) {
        console.error("Get conversations error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
