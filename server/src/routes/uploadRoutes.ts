import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";
import { protect } from "../middlewares/authMiddleware";

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

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter,
});

const router = Router();

router.post("/", protect, upload.single("image"), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Không tìm thấy file" });
        }
        
        // Cloudinary stores the file path securely in req.file.path
        const imageUrl = req.file.path;
        return res.status(200).json({ imageUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ message: "Upload failed" });
    }
});

// Middleware xử lý lỗi từ multer (VD: file quá lớn)
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError || err.message === "Chỉ chấp nhận file ảnh") {
        return res.status(400).json({ message: err.message || "Lỗi upload ảnh" });
    }
    next(err);
});

export default router;
