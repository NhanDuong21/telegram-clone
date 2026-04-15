import { Request } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "telegram-clone",
        resource_type: "auto", 
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov", "mkv"],
    } as any,
});

const fileFilter = (req: Request, file: any, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new Error("Chỉ chấp nhận file ảnh hoặc video"));
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter,
});
