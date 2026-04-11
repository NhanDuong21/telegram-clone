import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middlewares/authMiddleware";

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        cb(null, uploadDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    },
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
        
        const protocol = req.protocol;
        const host = req.get("host");
        const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
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
