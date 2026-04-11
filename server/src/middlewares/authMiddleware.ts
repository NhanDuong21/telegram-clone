import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

import { AuthRequest } from "../types";

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        let token: string | undefined;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Khong co token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: string;
        };

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User khong ton tai" });
        }

        req.user = user as IUser;
        next();
    } catch (error: unknown) {
        return res.status(401).json({ message: "Token khong hop le" });
    }
};