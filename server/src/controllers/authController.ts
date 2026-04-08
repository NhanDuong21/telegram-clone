import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { generateToken } from "../utils/generateToken";

export async function register(req: Request, res: Response) {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "vui long nhap day du username, email, password",
            });
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
        });

        const token = generateToken(String(newUser._id));

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
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            message: "Server error",
        });
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
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Server error",
        });
    }
}

interface AuthRequest extends Request {
    user?: any;
}

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        return res.status(200).json({
            user: req.user,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};