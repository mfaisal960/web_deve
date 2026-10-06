import { io } from "socket.io-client";
import backendUrl from "../server";

// Realtime messaging is served by the backend process itself, so reuse the API
// host by default. VITE_SOCKET_URL overrides it when realtime traffic is hosted
// separately from the REST API.
const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  backendUrl ||
  "http://localhost:8000"
).replace(/\/+$/, "");

const socket = io(SOCKET_URL, {
  withCredentials: true,
  // Keep the default transport negotiation instead of forcing websocket only.
  // A websocket-only client cannot fall back to HTTP long-polling, so any host
  // or proxy that refuses the upgrade left the connection permanently broken.
  transports: ["polling", "websocket"],
  reconnectionAttempts: 8,
  timeout: 10000,
  // The connection belongs to the seller inbox, not to every page of the app,
  // so it must not open as soon as this module is imported.
  autoConnect: false,
});

// socket.io-client only surfaces a generic manager error, while the reason the
// handshake failed (404 from a dead host, connection refused, CORS) is logged
// by the browser instead. Spell it out once per attempt.
socket.on("connect_error", (error) => {
  console.error(
    `Could not reach the chat server at ${SOCKET_URL}: ${error.message}. ` +
      `Start the backend with "npm run dev" from the project root, or point ` +
      `VITE_SOCKET_URL at the host running the socket.io server.`
  );
});

export default socket;