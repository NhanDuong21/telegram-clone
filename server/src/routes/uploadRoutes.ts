import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/uploadMiddleware";

const router = Router();

router.post("/", protect, upload.single("image"), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Không tìm thấy file" });
        }
        
        const imageUrl = req.file.path;
        return res.status(200).json({ imageUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ message: "Upload failed" });
    }
});

// Middleware xử lý lỗi từ multer
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError || err.message === "Chỉ chấp nhận file ảnh") {
        return res.status(400).json({ message: err.message || "Lỗi upload ảnh" });
    }
    next(err);
});

export default router;
