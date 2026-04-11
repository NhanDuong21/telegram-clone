import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import conversationRoutes from "./routes/conversationRoutes";
import messageRoutes from "./routes/messageRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import compression from "compression";

const app = express();
app.use(compression());

const allowedOrigins = [
    process.env.CLIENT_URL_PROD,
    process.env.CLIENT_URL_DEV,
    "http://localhost:5173",
    "https://telegram-nyan.onrender.com"
].filter(Boolean) as string[];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

// Serve uploads folder as static
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
    res.send("api sống nha cu");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

export default app;