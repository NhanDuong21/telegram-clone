import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://localhost:5000";

let socket: Socket | null = null;

/**
 * Connect to Socket.IO server with JWT authentication.
 * Token is sent via handshake auth — server verifies it before allowing connection.
 * No need to emit "join" — server extracts userId from token automatically.
 */
export const connectSocket = (): Socket => {
    if (socket && socket.connected) {
        return socket;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Cannot connect socket: no auth token");
    }

    socket = io(SERVER_URL, {
        auth: { token },
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket?.id);
    });

    socket.on("connect_error", (err) => {
        console.error("Socket auth failed:", err.message);
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
