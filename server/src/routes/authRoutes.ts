import { Router } from "express";
import { getMe, login, register, sendOtp, verifyOtp, resetPassword, changePassword } from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);
router.get("/me", protect, getMe);
export default router;