import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { searchUsers, updateProfile } from "../controllers/userController";

const router = Router();

// GET /api/users/search?q=keyword — tìm user theo username
router.get("/search", protect, searchUsers);

// PUT /api/users/me — cập nhật profile current user
router.put("/me", protect, updateProfile);

export default router;
