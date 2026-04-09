import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { createOrGetConversation, getMyConversations, createGroupConversation, updateGroupSettings, addMembers, removeMember } from "../controllers/conversationController";

const router = Router();

// Group management endpoints
router.post("/group", protect, createGroupConversation);
router.put("/:id/group-settings", protect, updateGroupSettings);
router.put("/:id/members", protect, addMembers);
router.delete("/:id/members/:memberId", protect, removeMember);

// POST /api/conversations — tạo hoặc lấy conversation 1-1
router.post("/", protect, createOrGetConversation);

// GET /api/conversations — danh sách conversations của user
router.get("/", protect, getMyConversations);

export default router;
