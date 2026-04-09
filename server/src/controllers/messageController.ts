import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Message from "../models/Message";
import Conversation from "../models/Conversation";
import { getIO } from "../socket";

// POST /api/messages
// Body: { conversationId, text }
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { conversationId, text, imageUrl } = req.body;
        const senderId = req.user._id;

        if (!conversationId) {
            return res.status(400).json({ message: "conversationId là bắt buộc" });
        }
        
        if (!text?.trim() && !imageUrl?.trim()) {
            return res.status(400).json({ message: "Cần ít nhất text hoặc hình ảnh" });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: senderId,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        const newMessage = await Message.create({
            conversationId,
            sender: senderId,
            text: text ? text.trim() : "",
            imageUrl: imageUrl ? imageUrl.trim() : "",
        });

        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const populated = await newMessage.populate("sender", "-password");

        // Emit to the OTHER participant(s) in realtime
        const io = getIO();
        conversation.participants.forEach((participantId) => {
            if (participantId.toString() !== senderId.toString()) {
                io.to(participantId.toString()).emit("newMessage", populated);
            }
        });

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
