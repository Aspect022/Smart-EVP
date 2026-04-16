import { io, type Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8080`;
    }
  }

  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
};

export const getSocket = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socketInstance) {
    socketInstance = io(getBackendUrl(), {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
  }

  return socketInstance;
};
