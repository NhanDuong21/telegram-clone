import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middlewares/authMiddleware";

// GET /api/users/search?q=keyword
// Tìm user theo username (không trả về chính mình)
export const searchUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { q } = req.query;

        // Nếu không có query thì trả mảng rỗng
        if (!q || typeof q !== "string") {
            return res.status(200).json({ users: [] });
        }

        // Tìm user có username chứa keyword (case-insensitive)
        // Loại trừ chính mình, không trả password
        const users = await User.find({
            username: { $regex: q, $options: "i" },
            _id: { $ne: req.user._id },
        })
            .select("-password")
            .limit(10);

        return res.status(200).json({ users });
    } catch (error) {
        console.error("Search users error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
