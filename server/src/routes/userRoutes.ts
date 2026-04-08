import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { searchUsers } from "../controllers/userController";

const router = Router();

// GET /api/users/search?q=keyword — tìm user theo username
router.get("/search", protect, searchUsers);

export default router;
