import { io, Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

/**
 * Connect to Socket.IO server with JWT authentication.
 * - Singleton: returns existing socket if one is alive (connected OR reconnecting)
 * - Only creates a new socket if none exists (first call or after manual disconnect)
 * - Socket.IO handles reconnection automatically with the config below
 */
export const connectSocket = (): Socket => {
    // Reuse existing socket — whether connected or mid-reconnect
    // socket is only null after disconnectSocket() or on first call
    if (socket) {
        return socket;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Cannot connect socket: no auth token");
    }

    socket = io(SERVER_URL, {
        auth: { token },
        reconnection: true,          // auto-reconnect on disconnect
        reconnectionAttempts: 10,     // try up to 10 times
        reconnectionDelay: 1000,      // start with 1s delay
        reconnectionDelayMax: 5000,   // cap at 5s between attempts
    });

    socket.on("connect", () => {
        console.log("[socket] connected:", socket?.id);
    });

    socket.on("reconnect", (attempt: number) => {
        console.log(`[socket] reconnected after ${attempt} attempt(s)`);
    });

    socket.on("connect_error", (err) => {
        console.error("[socket] connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
        console.log("[socket] disconnected:", reason);
    });

    return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.removeAllListeners(); // clean up all listeners from this module
        socket.disconnect();
        socket = null;
    }
};
