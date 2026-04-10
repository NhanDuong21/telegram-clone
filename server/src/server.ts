import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import connectDB from "./config/db";
import { initSocket } from "./socket";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
        console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
        console.log("CLIENT_URL exists:", !!process.env.CLIENT_URL);
        console.log("PORT:", process.env.PORT);
        const httpServer = http.createServer(app);
        initSocket(httpServer);

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Start server error:", error);
    }
};

startServer();