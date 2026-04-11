import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { searchUsers, updateProfile } from "../controllers/userController";
import { upload } from "../middlewares/uploadMiddleware";

const router = Router();

// GET /api/users/search?q=keyword — tìm user theo username
router.get("/search", protect, searchUsers);

// PUT /api/users/me — cập nhật profile current user
// Hỗ trợ upload file avatar mới
router.put("/me", protect, upload.single("avatar"), updateProfile);

export default router;
