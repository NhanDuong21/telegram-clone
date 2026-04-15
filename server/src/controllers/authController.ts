import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User, { IUser } from "../models/User";
import Otp from "../models/Otp";
import { generateToken } from "../utils/generateToken";
import { AuthRequest } from "../types";
import { sendOtpEmail } from "../utils/mailer";
import crypto from 'crypto';

export async function register(req: Request, res: Response) {
    try {
        const { username, email, password, verificationToken } = req.body;
        if (!username || !email || !password || !verificationToken) {
            return res.status(400).json({
                message: "vui long nhap day du thong tin va code xac thuc",
            });
        }

        // Verify the token
        const otpDoc = await Otp.findOne({ email, token: verificationToken });
        if (!otpDoc) {
            return res.status(400).json({ message: "Yêu cầu xác thực không hợp lệ. Vui lòng thực hiện lại từ bước OTP." });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "password phai co it nhat 6 ky tu",
            });
        }
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "email da ton tai",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            fullName: username, // Set fullName equal to username by default
        });

        const token = generateToken(String(newUser._id));

        // Delete the used OTP token
        await Otp.deleteOne({ email });

        return res.status(201).json({
            message: "Dang ky thanh cong",
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                avatar: newUser.avatar,
            },
            token,
        });
    } catch (error: unknown) {
        console.error("Register failed:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Vui long nhap email va password",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Email hoac password khong dung",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Email hoac password khong dung",
            });
        }

        const token = generateToken(String(user._id));

        return res.status(200).json({
            message: "Dang nhap thanh cong",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
            },
            token,
        });
    } catch (error: unknown) {
        console.error("Login failed:", error);
        res.status(500).json({ message: "Server error during login" });
    }
}

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json({
      user: req.user,
    });
  } catch (error: unknown) {
    return res.status(500).json({ message: "Server error" });
  }
};

export async function sendOtp(req: Request, res: Response) {
    try {
        const { email, type } = req.body; // type: 'register' or 'forgot'
        if (!email) {
            return res.status(400).json({ message: "Vui lòng nhập email" });
        }

        if (type === 'register') {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email đã tồn tại" });
            }
        } else if (type === 'forgot') {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "Email không tồn tại" });
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save OTP to DB (replace if exists)
        await Otp.findOneAndUpdate(
            { email },
            { otp, createdAt: new Date(), token: null },
            { upsert: true }
        );

        await sendOtpEmail(email, otp);

        res.status(200).json({ message: "Mã OTP đã được gửi đến email của bạn" });
    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({ 
            message: "Không thể gửi email OTP lúc này. Vui lòng thử lại sau.",
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
}

export async function verifyOtp(req: Request, res: Response) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mã OTP" });
        }

        const otpDoc = await Otp.findOne({ email, otp });
        if (!otpDoc) {
            return res.status(400).json({ message: "Mã OTP không đúng hoặc đã hết hạn" });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Update OTP doc with token for subsequent verification
        otpDoc.otp = "VERIFIED"; // Invalidate OTP
        // @ts-ignore
        otpDoc.token = verificationToken;
        await otpDoc.save();
        
        res.status(200).json({ 
            message: "Xác thực OTP thành công",
            verificationToken 
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Xác thực thất bại" });
    }
}

export async function resetPassword(req: Request, res: Response) {
    try {
        const { email, newPassword, verificationToken } = req.body;
        if (!email || !newPassword || !verificationToken) {
            return res.status(400).json({ message: "Thông tin không đầy đủ" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
        }

        const otpDoc = await Otp.findOne({ email, token: verificationToken });
        if (!otpDoc) {
            return res.status(400).json({ message: "Yêu cầu xác thực không hợp lệ." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Delete used token
        await Otp.deleteOne({ email });

        res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Không thể đổi mật khẩu" });
    }
}

export async function changePassword(req: AuthRequest, res: Response) {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user?._id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

        const user = await User.findById(userId).select("+password");
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi đổi mật khẩu" });
    }
}