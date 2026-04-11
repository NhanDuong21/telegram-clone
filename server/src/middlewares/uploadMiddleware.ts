import { Request } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "telegram-clone",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    } as any,
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Chỉ chấp nhận file ảnh"));
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter,
});
