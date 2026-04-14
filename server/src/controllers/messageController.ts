import { Response } from "express";
import { AuthRequest } from "../types";
import * as messageService from "../services/messageService";

export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        let { conversationId, text, imageUrl, replyTo, forwardFrom, type } = req.body;
        const senderId = req.user!._id;

        const files = req.files as Express.Multer.File[];
        let imageUrls: string[] = [];

        if (files && files.length > 0) {
            imageUrls = files.map(f => f.path);
            if (!imageUrl) imageUrl = imageUrls[0];
            type = 'image';
        }

        if (!conversationId) {
            return res.status(400).json({ message: "conversationId là bắt buộc" });
        }
        
        if (type !== 'system' && !text?.trim() && !imageUrl?.trim() && imageUrls.length === 0) {
            return res.status(400).json({ message: "Cần ít nhất text hoặc hình ảnh" });
        }

        const message = await messageService.sendMessageService(conversationId, senderId.toString(), text, imageUrl, replyTo, forwardFrom, type, imageUrls);
        return res.status(201).json({ message });
    } catch (error: unknown) {
        console.error("Send message error:", error);
        const err = error as Error;
        if (err.message === "Conversation không tồn tại") {
            return res.status(404).json({ message: err.message });
        }
        return res.status(500).json({ message: "Server error" });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user!._id;
        const { before } = req.query;
        const limit = parseInt(req.query.limit as string) || 30;

        const result = await messageService.getMessagesService(conversationId as string, userId.toString(), before as string, limit);
        return res.status(200).json(result);
    } catch (error: unknown) {
        console.error("Get messages error:", error);
        const err = error as Error;
        if (err.message === "Conversation không tồn tại") {
            return res.status(404).json({ message: err.message });
        }
        return res.status(500).json({ message: "Server error" });
    }
};
export const deleteMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'one-way' or 'two-way'
        const userId = req.user!._id;

        if (!type || !['one-way', 'two-way'].includes(type)) {
            return res.status(400).json({ message: "Loại xóa không hợp lệ" });
        }

        const message = await messageService.deleteMessageService(id, userId.toString(), type);
        return res.status(200).json({ message: "Xóa thành công", deletedMessage: message });
    } catch (error: unknown) {
        console.error("Delete message error:", error);
        const err = error as Error;
        const status = err.message.includes("không tồn tại") ? 404 : err.message.includes("không có quyền") ? 403 : 500;
        return res.status(status).json({ message: err.message || "Server error" });
    }
};
export const updateMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { text, isPinned, pinForBoth } = req.body;
        const userId = req.user!._id;

        const message = await messageService.updateMessageService(id, userId.toString(), { text, isPinned, pinForBoth });
        return res.status(200).json({ message: "Cập nhật thành công", updatedMessage: message });
    } catch (error: unknown) {
        console.error("Update message error:", error);
        const err = error as Error;
        const status = err.message.includes("không tồn tại") ? 404 : err.message.includes("không có quyền") ? 403 : 500;
        return res.status(status).json({ message: err.message || "Server error" });
    }
};

export const getSharedMedia = async (req: AuthRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { type, before, limit } = req.query;
        const userId = req.user!._id;

        const result = await messageService.getSharedMediaService(
            conversationId, 
            userId.toString(), 
            (type as string) || 'image', 
            before as string, 
            parseInt(limit as string) || 30
        );
        return res.status(200).json(result);
    } catch (error: unknown) {
        console.error("Get shared media error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const removeFile = async (req: AuthRequest, res: Response) => {
    try {
        const { messageId } = req.params;
        const { fileUrl, type } = req.body;
        const userId = req.user!._id;

        if (!fileUrl) {
            return res.status(400).json({ message: "fileUrl là bắt buộc" });
        }

        const result = await messageService.removeFileService(messageId, userId.toString(), fileUrl, type);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error("Remove file error:", error);
        return res.status(500).json({ message: error.message || "Không thể xóa tệp" });
    }
};
