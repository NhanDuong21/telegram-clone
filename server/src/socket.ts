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
    const isProd = process.env.NODE_ENV === "production";
    const clientUrl = isProd ? process.env.CLIENT_URL_PROD : process.env.CLIENT_URL_DEV;

    io = new Server(httpServer, {
        cors: {
            origin: clientUrl || "*",
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

        // Typing indicator via room broadcast
        socket.on("typing", ({ conversationId, isTyping }) => {
            if (userId && conversationId) {
                // Broadcast to everyone else in the room
                socket.to(conversationId).emit("typing", { senderId: userId, isTyping });
            }
        });

        // Join specific conversation room for real-time messages
        socket.on("joinRoom", (roomId: string) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        // Read Receipts listener
        socket.on("markAsRead", async ({ messageId, conversationId }) => {
            if (userId && messageId && conversationId) {
                try {
                    const Message = (await import("./models/Message")).default;
                    await Message.findByIdAndUpdate(messageId, {
                        $addToSet: { readBy: userId }
                    });
                    
                    // Broadcast to everyone in the room that this message was read by this user
                    io.to(conversationId).emit("messageRead", { messageId, userId, conversationId });
                } catch (error) {
                    console.error("markAsRead error:", error);
                }
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
