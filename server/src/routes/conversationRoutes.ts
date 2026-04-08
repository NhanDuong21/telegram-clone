import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { createOrGetConversation, getMyConversations } from "../controllers/conversationController";

const router = Router();

// POST /api/conversations — tạo hoặc lấy conversation 1-1
router.post("/", protect, createOrGetConversation);

// GET /api/conversations — danh sách conversations của user
router.get("/", protect, getMyConversations);

export default router;
