/**
 * Singleton socket instance shared across the app.
 * Import `getSocket()` wherever you need real-time events.
 */
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = API_BASE.replace("/api", "");

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: true });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
