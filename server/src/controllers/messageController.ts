import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Message from "../models/Message";
import Conversation from "../models/Conversation";

// POST /api/messages
// Body: { conversationId, text }
// Gửi tin nhắn vào conversation
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { conversationId, text } = req.body;
        const senderId = req.user._id;

        if (!conversationId || !text?.trim()) {
            return res.status(400).json({ message: "conversationId và text là bắt buộc" });
        }

        // Kiểm tra conversation tồn tại và user là participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: senderId,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        // Tạo message mới
        const newMessage = await Message.create({
            conversationId,
            sender: senderId,
            text: text.trim(),
        });

        // Cập nhật lastMessage và updatedAt của conversation
        conversation.lastMessage = newMessage._id;
        await conversation.save();

        // Populate sender trước khi trả về
        const populated = await newMessage.populate("sender", "-password");

        return res.status(201).json({ message: populated });
    } catch (error) {
        console.error("Send message error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// GET /api/messages/:conversationId
// Lấy tất cả tin nhắn trong 1 conversation
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        // Kiểm tra user là participant của conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        // Lấy messages, sắp xếp theo thời gian tạo (cũ → mới)
        const messages = await Message.find({ conversationId })
            .populate("sender", "-password")
            .sort({ createdAt: 1 });

        return res.status(200).json({ messages });
    } catch (error) {
        console.error("Get messages error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
