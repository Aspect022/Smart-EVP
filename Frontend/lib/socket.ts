import { io } from "socket.io-client";

export const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8080`;
    }
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
};

// Export a singleton instance of the socket
export const socket = io(getBackendUrl(), {
  autoConnect: false, // We'll manage connection explicitly in the hook
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
