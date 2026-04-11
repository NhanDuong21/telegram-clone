import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server;
const userSocketMap = new Map<string, string>(); // socketId -> userId

// Extend Socket type to include userId
interface AuthenticatedSocket extends Socket {
    userId?: string;
}

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "*",
            credentials: true,
        },
    });

    // --------------------------------------------------
    // Middleware: verify JWT token BEFORE allowing connection
    // --------------------------------------------------
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth?.token as string | undefined;

        if (!token) {
            return next(new Error("Authentication error: no token"));
        }

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET as string
            ) as { userId: string };

            // Attach userId to socket object — trusted from token, not from client
            socket.userId = decoded.userId;
            next();
        } catch {
            return next(new Error("Authentication error: invalid token"));
        }
    });

    const emitOnlineUsers = () => {
        const activeUsers = Array.from(new Set(userSocketMap.values()));
        io.emit("onlineUsers", activeUsers);
    };

    io.on("connection", (rawSocket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const userId = socket.userId!;

        // Auto-join the user's personal room (no "join" event needed)
        socket.join(userId);
        userSocketMap.set(socket.id, userId);
        console.log(`Socket connected: ${socket.id} (user: ${userId})`);
        emitOnlineUsers();

        // Typing indicator
        socket.on("typing", ({ receiverId, isTyping }) => {
            if (userId && receiverId) {
                io.to(receiverId).emit("typing", { senderId: userId, isTyping });
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id} (user: ${userId})`);
            userSocketMap.delete(socket.id);
            emitOnlineUsers();
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error("Socket.IO chưa được khởi tạo!");
    }
    return io;
};
