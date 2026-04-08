import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server;
const userSocketMap = new Map<string, string>(); // socket.id -> userId

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
        },
    });

    const emitOnlineUsers = () => {
        const activeUsers = Array.from(new Set(userSocketMap.values()));
        io.emit("onlineUsers", activeUsers);
    };

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Client gửi userId sau khi login → join vào room riêng
        socket.on("join", (userId: string) => {
            socket.join(userId);
            userSocketMap.set(socket.id, userId);
            console.log(`User ${userId} joined room`);
            emitOnlineUsers();
        });

        // Xử lý typing indicator
        socket.on("typing", ({ receiverId, isTyping }) => {
            const senderId = userSocketMap.get(socket.id);
            if (senderId && receiverId) {
                io.to(receiverId).emit("typing", { senderId, isTyping });
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
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

