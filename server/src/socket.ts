import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { SOCKET_EVENTS } from "./utils/socketEvents";
import * as messageService from "./services/messageService";

let io: Server;
const userSocketMap = new Map<string, string>(); // socketId -> userId

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

interface TypingPayload {
    conversationId: string;
    isTyping: boolean;
}

interface MarkAsReadPayload {
    messageId: string;
    conversationId: string;
}

export const initSocket = (httpServer: HttpServer) => {
    const isProd = process.env.NODE_ENV === "production";
    const clientUrl = isProd ? process.env.CLIENT_URL_PROD : process.env.CLIENT_URL_DEV;

    io = new Server(httpServer, {
        cors: {
            origin: clientUrl || "*",
            credentials: true,
        },
        transports: ["websocket"],
    });

    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return next(new Error("Authentication error: no token"));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
            socket.userId = decoded.userId;
            next();
        } catch {
            return next(new Error("Authentication error: invalid token"));
        }
    });

    const emitOnlineUsers = () => {
        const activeUsers = Array.from(new Set(userSocketMap.values()));
        io.emit(SOCKET_EVENTS.ONLINE_USERS, activeUsers);
    };

    io.on(SOCKET_EVENTS.CONNECTION, (rawSocket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const userId = socket.userId!;

        socket.join(`user_${userId}`);
        userSocketMap.set(socket.id, userId);
        emitOnlineUsers();

        socket.on(SOCKET_EVENTS.TYPING, ({ conversationId, isTyping }: TypingPayload) => {
            if (userId && conversationId) {
                socket.to(conversationId).emit(SOCKET_EVENTS.TYPING, { senderId: userId, isTyping });
            }
        });

        socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId: string) => {
            socket.join(roomId);
        });

        socket.on(SOCKET_EVENTS.MARK_AS_READ, async ({ messageId, conversationId }: MarkAsReadPayload) => {
            if (userId && messageId && conversationId) {
                try {
                    await messageService.markAsReadService(messageId, conversationId, userId);
                } catch (error: unknown) {
                    console.error("markAsRead error:", error);
                }
            }
        });

        socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
            userSocketMap.delete(socket.id);
            emitOnlineUsers();
            
            try {
                const User = (await import("./models/User")).default;
                await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
            } catch (error) {
                console.error("Update lastSeen failed:", error);
            }
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) throw new Error("Socket.IO chưa được khởi tạo!");
    return io;
};
