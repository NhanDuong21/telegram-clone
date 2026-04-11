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

        // Emit to the conversation room in realtime so all active clients get it
        const io = getIO();
        io.to(conversationId.toString()).emit("receiveMessage", populated);

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

        const { before } = req.query;
        const limit = parseInt(req.query.limit as string) || 30;

        // Kiểm tra user là participant của conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        const query: any = { conversationId };
        if (before) {
            query.createdAt = { $lt: new Date(before as string) };
        }

        // Lấy messages, sắp xếp theo thời gian tạo (mới -> cũ) để lấy những tin nhắn gần nhất
        const messages = await Message.find(query)
            .populate("sender", "-password")
            .sort({ createdAt: -1 })
            .limit(limit + 1); // +1 để kiểm tra xem còn data cũ hơn không

        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop(); // loại bỏ phần tử thừa
        }

        // Đảo ngược array để trả về đúng thứ tự cũ -> mới cho UI
        messages.reverse();

        return res.status(200).json({ messages, hasMore });
    } catch (error) {
        console.error("Get messages error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
