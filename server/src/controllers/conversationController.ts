import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Conversation from "../models/Conversation";

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
