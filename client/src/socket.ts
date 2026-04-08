import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://localhost:5000";

let socket: Socket | null = null;

export const connectSocket = (userId: string): Socket => {
    if (socket && socket.connected) {
        return socket;
    }

    socket = io(SERVER_URL);

    socket.on("connect", () => {
        console.log("Socket connected:", socket?.id);
        socket?.emit("join", userId);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected");
    });

    return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
