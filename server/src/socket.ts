import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { SOCKET_EVENTS } from "./utils/socketEvents";
import * as messageService from "./services/messageService";
import mongoose from "mongoose";

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
    conversationId: string;
}

export const emitOnlineUsersForUser = async (userId: string) => {
    if (!io) return;
    const activeUsers = Array.from(new Set(userSocketMap.values()));
    const User = (await import("./models/User")).default;

    const owner = await User.findById(userId).select("blockedUsers").lean();
    const trackersOfOwner = await User.find({ blockedUsers: userId }).select("_id").lean();
    
    // Privacy logic: You can't see someone if you block them OR if they block you
    const restrictedIds = new Set([
        ...(owner?.blockedUsers?.map(id => id.toString()) || []),
        ...trackersOfOwner.map(t => t._id.toString())
    ]);

    const filteredList = activeUsers.filter(id => !restrictedIds.has(id));
    io.to(`user_${userId}`).emit(SOCKET_EVENTS.ONLINE_USERS, filteredList);
};

export const initSocket = (httpServer: HttpServer) => {
    const allowedOrigins = [
        process.env.CLIENT_URL_PROD,
        process.env.CLIENT_URL_DEV,
        "http://localhost:5173",
        "https://telegram-nyan.onrender.com"
    ].filter(Boolean) as string[];

    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
        transports: ["websocket", "polling"],
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

    const emitOnlineUsers = async () => {
        const activeUserIds = Array.from(new Set(userSocketMap.values()));
        for (const userId of activeUserIds) {
            await emitOnlineUsersForUser(userId);
        }
    };

    io.on(SOCKET_EVENTS.CONNECTION, async (rawSocket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const userId = socket.userId!;

        socket.join(`user_${userId}`);
        userSocketMap.set(socket.id, userId);
        await emitOnlineUsers();

        socket.on(SOCKET_EVENTS.TYPING, async ({ conversationId }: { conversationId: string }) => {
            if (userId && conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
                const Conversation = (await import("./models/Conversation")).default;
                const conv = await Conversation.findById(conversationId).select("participants").lean();
                if (conv) {
                    conv.participants.forEach(p => {
                        if (p.toString() !== userId) {
                            io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.TYPING, { senderId: userId, conversationId });
                        }
                    });
                }
            }
        });

        socket.on(SOCKET_EVENTS.STOP_TYPING, async ({ conversationId }: { conversationId: string }) => {
            if (userId && conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
                const Conversation = (await import("./models/Conversation")).default;
                const conv = await Conversation.findById(conversationId).select("participants").lean();
                if (conv) {
                    conv.participants.forEach(p => {
                        if (p.toString() !== userId) {
                            io.to(`user_${p.toString()}`).emit(SOCKET_EVENTS.STOP_TYPING, { senderId: userId, conversationId });
                        }
                    });
                }
            }
        });

        socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId: string) => {
            socket.join(roomId);
        });

        socket.on(SOCKET_EVENTS.MARK_AS_READ, async ({ conversationId }: MarkAsReadPayload) => {
            if (userId && conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
                try {
                    await messageService.markAsReadService(conversationId, userId);
                } catch (error: unknown) {
                    console.error("markAsRead error:", error);
                }
            }
        });

        socket.on(SOCKET_EVENTS.SEND_REACTION, async ({ messageId, emoji }: { messageId: string, emoji: string }) => {
            if (userId && messageId && emoji && mongoose.Types.ObjectId.isValid(messageId)) {
                try {
                    await messageService.sendReactionService(messageId, userId, emoji);
                } catch (error: unknown) {
                    console.error("sendReaction error:", error);
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
