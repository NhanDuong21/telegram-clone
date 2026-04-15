import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { createOrGetConversation, getMyConversations, createGroupConversation, updateGroupSettings, addMembers, removeMember, deleteGroupConversation, leaveGroup, clearChat, deleteConversation } from "../controllers/conversationController";

const router = Router();

// Group management endpoints
router.post("/group", protect, createGroupConversation);
router.put("/:id/group-settings", protect, updateGroupSettings);
router.put("/:id/members", protect, addMembers);
router.delete("/:id/members/:memberId", protect, removeMember);
router.post("/:id/leave", protect, leaveGroup);
router.delete("/:id/group", protect, deleteGroupConversation);

// POST /api/conversations — tạo hoặc lấy conversation 1-1
router.post("/", protect, createOrGetConversation);

// GET /api/conversations — danh sách conversations của user
router.get("/", protect, getMyConversations);

// Xóa toàn bộ message trong conversation (Clear history)
router.delete("/:id/messages", protect, clearChat);

// Xóa hẳn conversation 1-1
router.delete("/:id", protect, deleteConversation);

export default router;
