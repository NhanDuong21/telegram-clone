import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { sendMessage, getMessages, deleteMessage, updateMessage } from "../controllers/messageController";

const router = Router();

// POST /api/messages — gửi tin nhắn
router.post("/", protect, sendMessage);

// GET /api/messages/:conversationId — lấy tin nhắn theo conversation
router.get("/:conversationId", protect, getMessages);

// PATCH /api/messages/:id — cập nhật tin nhắn (edit/pin)
router.patch("/:id", protect, updateMessage);

// DELETE /api/messages/:id — xóa tin nhắn
router.delete("/:id", protect, deleteMessage);

export default router;
