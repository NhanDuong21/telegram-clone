import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../types";

// GET /api/users/search?q=keyword
// Tìm user theo username (không trả về chính mình)
export const searchUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { q } = req.query;

        // Nếu không có query thì trả mảng rỗng
        if (!q || typeof q !== "string") {
            return res.status(200).json({ users: [] });
        }

        // Tìm user có username khớp chính xác (case-insensitive)
        const users = await User.find({
            username: new RegExp(`^${q}$`, 'i'),
            _id: { $ne: req.user!._id },
        })
            .select("-password")
            .limit(1); // Usually only one exact match possible

        return res.status(200).json({ users });
    } catch (error: unknown) {
        console.error("Search users error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/users/me
// Cập nhật profile (username, avatar)
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { username, avatar } = req.body;
        const userId = req.user!._id;

        if (!username || username.trim().length < 2) {
            return res.status(400).json({ message: "Username không hợp lệ (ít nhất 2 ký tự)" });
        }

        // Check required uniqueness if username changes
        if (username.trim() !== req.user!.username) {
            const existing = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
            if (existing) {
                return res.status(400).json({ message: "Username đã tồn tại" });
            }
        }

        let avatarUrl = req.body.avatar;
        if (req.file) {
            avatarUrl = req.file.path;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                username: username.trim(),
                avatar: avatarUrl !== undefined ? avatarUrl.trim() : req.user!.avatar
            },
            { new: true }
        ).select("-password");

        return res.status(200).json({ user: updatedUser });
    } catch (error: unknown) {
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user!._id;

        const targetUser = await User.findById(id).select("-password");
        if (!targetUser) return res.status(404).json({ message: "User không tồn tại" });

        const Conversation = (await import("../models/Conversation")).default;
        const Message = (await import("../models/Message")).default;

        // Tìm tất cả conversations mà cả 2 đều là participants
        const sharedConvs = await Conversation.find({
            participants: { $all: [currentUserId, id] }
        });

        const sharedConvIds = sharedConvs.map(c => c._id);
        const commonGroupsCount = sharedConvs.filter(c => c.isGroup).length;

        // Đếm shared media trong các conversation chung
        const photosCount = await Message.countDocuments({
            conversationId: { $in: sharedConvIds },
            imageUrl: { $ne: "" }
        });

        // Simplified link detection
        const linksCount = await Message.countDocuments({
            conversationId: { $in: sharedConvIds },
            text: { $regex: /https?:\/\/[^\s]+/ }
        });

        return res.status(200).json({
            user: targetUser,
            sharedMedia: {
                photos: photosCount,
                links: linksCount,
                files: 0, // Placeholder
                videos: 0, // Placeholder
                audio: 0   // Placeholder
            },
            commonGroupsCount
        });
    } catch (error: unknown) {
        console.error("Get user profile error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
export const toggleBlockUser = async (req: AuthRequest, res: Response) => {
    try {
        const { targetId } = req.body;
        const userId = req.user!._id;

        if (String(userId) === String(targetId)) {
            return res.status(400).json({ message: "Bạn không thể chặn chính mình" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User không tồn tại" });

        const targetUser = await User.findById(targetId);
        if (!targetUser) return res.status(404).json({ message: "Đối tượng chặn không tồn tại" });

        const isBlocked = user.blockedUsers.some(id => String(id) === String(targetId));

        if (isBlocked) {
            // Unblock
            user.blockedUsers = user.blockedUsers.filter(id => String(id) !== String(targetId));
        } else {
            // Block
            user.blockedUsers.push(targetId);
        }

        await user.save();

        const { getIO } = await import("../socket");
        const { SOCKET_EVENTS } = await import("../utils/socketEvents");
        const io = getIO();
        
        // Notify blocker
        io.to(`user_${userId}`).emit(SOCKET_EVENTS.USER_BLOCK_UPDATED, {
            targetId,
            isBlocked: !isBlocked,
            blockedUsers: user.blockedUsers
        });

        // Notify blocked user
        io.to(`user_${targetId}`).emit(SOCKET_EVENTS.USER_BLOCK_UPDATED, {
            updaterId: userId,
            isBlockingMe: !isBlocked
        });

        return res.status(200).json({ 
            message: isBlocked ? "Đã bỏ chặn" : "Đã chặn người dùng",
            blockedUsers: user.blockedUsers 
        });
    } catch (error: unknown) {
        console.error("Toggle block error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
