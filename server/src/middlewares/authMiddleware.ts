import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        let token;

        // lấy token từ header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Khong co token" });
        }

        // verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as { userId: string };

        // tìm user
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User khong ton tai" });
        }

        // gắn user vào request
        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Token khong hop le" });
    }
};