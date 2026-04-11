import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import connectDB from "./config/db";
import { initSocket } from "./socket";

const PORT = process.env.PORT || 5000;

const isProd = process.env.NODE_ENV === "production";
console.log("Environment:", process.env.NODE_ENV || "development");
console.log("MONGO_URI exists:", !!(isProd ? process.env.MONGO_URI_PROD : process.env.MONGO_URI_DEV));
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("CLIENT_URL:", process.env.NODE_ENV === "production" ? process.env.CLIENT_URL_PROD : process.env.CLIENT_URL_DEV);
console.log("PORT:", process.env.PORT);

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