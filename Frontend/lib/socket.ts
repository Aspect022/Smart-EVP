import { io } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

// Export a singleton instance of the socket
export const socket = io(BACKEND_URL, {
  autoConnect: false, // We'll manage connection explicitly in the hook
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
