import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
        },
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Client gửi userId sau khi login → join vào room riêng
        socket.on("join", (userId: string) => {
            socket.join(userId);
            console.log(`User ${userId} joined room`);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
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
