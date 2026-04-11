import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import connectDB from "./config/db";
import { initSocket } from "./socket";

const PORT = process.env.PORT || 5000;

console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

const startServer = async () => {
    try {
        await connectDB();

        const httpServer = http.createServer(app);
        initSocket(httpServer);

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Start server error:", error);
        process.exit(1);
    }
};

startServer();