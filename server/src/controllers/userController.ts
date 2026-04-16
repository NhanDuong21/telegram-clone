import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../types";
import Otp from "../models/Otp";
import { sendOtpEmail } from "../utils/mailer";

// GET /api/users/search?q=keyword
// Tìm user theo username (không trả về chính mình)
export const searchUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== "string") {
            return res.status(200).json({ users: [] });
        }

        const searchQuery = q.startsWith('@') 
            ? { username: new RegExp(q.slice(1), 'i') } 
            : { 
                $or: [
                    { fullName: new RegExp(q, 'i') },
                    { username: new RegExp(q, 'i') }
                ]
              };

        const users = await User.find({
            ...searchQuery,
            _id: { $ne: req.user!._id },
        })
            .select("username fullName avatar lastSeen")
            .limit(10);

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
        const { username, fullName, bio, birthday } = req.body;
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
                fullName: fullName ? fullName.trim() : req.user!.fullName,
                bio: bio ? bio.trim() : req.user!.bio,
                birthday: birthday ? new Date(birthday) : req.user!.birthday,
                avatar: avatarUrl !== undefined ? avatarUrl.trim() : req.user!.avatar
            },
            { new: true }
        ).select("-password");

        const { getIO } = await import("../socket");
        const { SOCKET_EVENTS } = await import("../utils/socketEvents");
        const io = getIO();
        io.emit(SOCKET_EVENTS.USER_UPDATED, updatedUser);

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

        // RE-FETCH ONLINE STATUS (PRIVACY)
        const { emitOnlineUsersForUser } = await import("../socket");
        await emitOnlineUsersForUser(userId.toString());
        await emitOnlineUsersForUser(targetId.toString());

        return res.status(200).json({ 
            message: isBlocked ? "Đã bỏ chặn" : "Đã chặn người dùng",
            blockedUsers: user.blockedUsers 
        });
    } catch (error: unknown) {
        console.error("Toggle block error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// POST /api/users/request-email-change
export const requestEmailChange = async (req: AuthRequest, res: Response) => {
    try {
        const { newEmail } = req.body;
        const userId = req.user!._id;

        if (!newEmail || !newEmail.includes('@')) {
            return res.status(400).json({ message: "Email không hợp lệ" });
        }

        // Check if email is already taken
        const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "Email này đã được sử dụng bởi một tài khoản khác" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in database (associated with the user)
        // We use the newEmail as the key in the Otp collection
        await Otp.findOneAndUpdate(
            { email: newEmail.toLowerCase() },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Send Email
        await sendOtpEmail(newEmail, otp);

        return res.status(200).json({ message: "Mã OTP đã được gửi đến email mới của bạn" });
    } catch (error) {
        console.error("Request email change error:", error);
        return res.status(500).json({ 
            message: "Không thể gửi email OTP lúc này. Vui lòng thử lại sau.",
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

// POST /api/users/verify-email-change
export const verifyEmailChange = async (req: AuthRequest, res: Response) => {
    try {
        const { newEmail, otp } = req.body;
        const userId = req.user!._id;

        if (!newEmail || !otp) {
            return res.status(400).json({ message: "Thiếu thông tin email hoặc OTP" });
        }

        const otpRecord = await Otp.findOne({ email: newEmail.toLowerCase(), otp });

        if (!otpRecord) {
            return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn" });
        }

        // Update user email
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { email: newEmail.toLowerCase() },
            { new: true }
        ).select("-password");

        // Clear OTP
        await Otp.deleteOne({ _id: otpRecord._id });

        const { getIO } = await import("../socket");
        const { SOCKET_EVENTS } = await import("../utils/socketEvents");
        const io = getIO();
        io.emit(SOCKET_EVENTS.USER_UPDATED, updatedUser);

        return res.status(200).json({ 
            message: "Cập nhật email thành công",
            user: updatedUser
        });
    } catch (error) {
        console.error("Verify email change error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
