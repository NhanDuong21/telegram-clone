import { Response } from "express";
import { AuthRequest } from "../types";
import * as conversationService from "../services/conversationService";

export const createGroupConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { name, participantIds } = req.body;
        const senderId = req.user!._id.toString();

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Tên nhóm là bắt buộc" });
        }

        if (!participantIds || !Array.isArray(participantIds)) {
            return res.status(400).json({ message: "participantIds phải là một array" });
        }

        const conversation = await conversationService.createGroupService(name, participantIds, senderId);
        return res.status(201).json({ conversation });
    } catch (error: unknown) {
        console.error("Create group error:", error);
        const err = error as Error;
        return res.status(err.message.includes("ít nhất 3") ? 400 : 500).json({ message: err.message || "Server error" });
    }
};

export const updateGroupSettings = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, imageUrl, description, showHistoryForNewMembers, permissions } = req.body;
        const userId = req.user!._id.toString();

        const conversation = await conversationService.updateGroupSettingsService(id as string, userId, { 
            name, 
            imageUrl,
            description,
            showHistoryForNewMembers,
            permissions
        });
        return res.status(200).json({ conversation });
    } catch (error: unknown) {
        console.error("Update group error:", error);
        const err = error as Error;
        const status = err.message.includes("không tồn tại") ? 404 : err.message.includes("không có quyền") ? 403 : 400;
        return res.status(status).json({ message: err.message || "Server error" });
    }
};

export const addMembers = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { participantIds } = req.body;
        const userId = req.user!._id.toString();

        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ message: "Danh sách member không hợp lệ" });
        }

        const conversation = await conversationService.addMembersService(id as string, userId, participantIds);
        return res.status(200).json({ conversation });
    } catch (error: unknown) {
        console.error("Add members error:", error);
        const err = error as Error;
        return res.status(500).json({ message: err.message || "Server error" });
    }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user!._id.toString();

        const conversation = await conversationService.removeMemberService(id as string, userId, memberId as string);
        return res.status(200).json({ conversation });
    } catch (error: unknown) {
        console.error("Remove member error:", error);
        const err = error as Error;
        return res.status(400).json({ message: err.message || "Server error" });
    }
};

export const deleteGroupConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id.toString();

        const deletedId = await conversationService.deleteGroupService(id as string, userId);
        return res.status(200).json({ message: "Xóa group thành công", deletedConversationId: deletedId });
    } catch (error: unknown) {
        console.error("Delete group error:", error);
        const err = error as Error;
        return res.status(500).json({ message: err.message || "Server error" });
    }
};

export const leaveGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id.toString();

        const result = await conversationService.leaveGroupService(id as string, userId);
        if (result.deleted) {
            return res.status(200).json({ message: "Nhóm đã bị xóa do không đủ thành viên", deleted: true });
        }
        return res.status(200).json({ message: "Đã rời nhóm", conversation: result.conversation });
    } catch (error: unknown) {
        console.error("Leave group error:", error);
        const err = error as Error;
        return res.status(400).json({ message: err.message || "Server error" });
    }
};

export const createOrGetConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user!._id.toString();

        if (!receiverId) {
            return res.status(400).json({ message: "receiverId là bắt buộc" });
        }

        const conversation = await conversationService.createOrGetConversationService(senderId, receiverId);
        return res.status(201).json({ conversation });
    } catch (error: unknown) {
        console.error("Create conversation error:", error);
        const err = error as Error;
        return res.status(400).json({ message: err.message || "Server error" });
    }
};

export const getMyConversations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id.toString();
        const conversations = await conversationService.getMyConversationsService(userId);
        return res.status(200).json({ conversations });
    } catch (error: unknown) {
        console.error("Get conversations error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const clearChat = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { deleteForBoth } = req.body;
        const userId = req.user!._id.toString();

        const clearedId = await conversationService.clearChatService(id as string, userId, deleteForBoth);
        return res.status(200).json({ message: "Đã xóa toàn bộ tin nhắn", clearedConversationId: clearedId });
    } catch (error: unknown) {
        console.error("Clear chat error:", error);
        const err = error as Error;
        return res.status(500).json({ message: err.message || "Server error" });
    }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { deleteForBoth } = req.body;
        const userId = req.user!._id.toString();

        const deletedId = await conversationService.deleteConversationService(id as string, userId, deleteForBoth);
        return res.status(200).json({ message: "Đã xóa hiển thị chat", deletedConversationId: deletedId });
    } catch (error: unknown) {
        console.error("Delete conversation error:", error);
        const err = error as Error;
        return res.status(500).json({ message: err.message || "Server error" });
    }
};
