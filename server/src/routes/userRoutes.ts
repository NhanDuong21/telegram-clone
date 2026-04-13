import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { 
    searchUsers, 
    updateProfile, 
    getUserProfile, 
    toggleBlockUser,
    requestEmailChange,
    verifyEmailChange
} from "../controllers/userController";
import { upload } from "../middlewares/uploadMiddleware";

const router = Router();

// GET /api/users/search?q=keyword — tìm user theo username
router.get("/search", protect, searchUsers);

// GET /api/users/:id/profile — lấy thông tin profile chi tiết
router.get("/:id/profile", protect, getUserProfile);

// PUT /api/users/me — cập nhật profile current user
// Hỗ trợ upload file avatar mới
router.put("/me", protect, upload.single("avatar"), updateProfile);
router.post("/toggle-block", protect, toggleBlockUser);

// Email change flow
router.post("/request-email-change", protect, requestEmailChange);
router.post("/verify-email-change", protect, verifyEmailChange);

export default router;
