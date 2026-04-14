import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { sendMessage, getMessages, deleteMessage, updateMessage, getSharedMedia, removeFile } from "../controllers/messageController";
import { upload } from "../middlewares/uploadMiddleware";

const router = Router();

// POST /api/messages — gửi tin nhắn
router.post("/", protect, upload.array("images", 10), sendMessage);

// GET /api/messages/:conversationId — lấy tin nhắn theo conversation
router.get("/:conversationId", protect, getMessages);

// PATCH /api/messages/:id — cập nhật tin nhắn (edit/pin)
router.patch("/:id", protect, updateMessage);

// DELETE /api/messages/:id — xóa tin nhắn
router.delete("/:id", protect, deleteMessage);

// GET /api/messages/shared-media/:conversationId — lấy media chung
router.get("/shared-media/:conversationId", protect, getSharedMedia);

// PATCH /api/messages/:messageId/remove-file — xóa một file trong album
router.patch("/:messageId/remove-file", protect, removeFile);

export default router;
