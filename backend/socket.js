const { Server } = require("socket.io");

// Online users are tracked in memory: a seller is only reachable over the socket
// while their dashboard tab is open. Persistence lives in MongoDB (the message
// itself is written by the REST controller), so this list can stay ephemeral.
const onlineUsers = [];

const emitUsers = (io) => {
  io.emit("getUsers", onlineUsers);
};

const addUser = (io, userId, socketId) => {
  // A user can have several tabs open. Reconnecting from a new tab must not
  // leave the previous socket id in the list, otherwise sendMessage would be
  // routed to a socket that is already closed.
  const existing = onlineUsers.findIndex((user) => user.userId === userId);

  if (existing !== -1) {
    onlineUsers.splice(existing, 1);
  }

  onlineUsers.push({ userId, socketId });
  emitUsers(io);
};

const removeUser = (io, socketId) => {
  const index = onlineUsers.findIndex((user) => user.socketId === socketId);

  if (index === -1) {
    return;
  }

  onlineUsers.splice(index, 1);
  emitUsers(io);
};

const getUser = (userId) => onlineUsers.find((user) => user.userId === userId);

const initSocketServer = (httpServer, { corsOrigin } = {}) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || true,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("addUser", (userId) => {
      if (!userId) return;
      addUser(io, userId, socket.id);
    });

    socket.on("sendMessage", ({ senderId, receiverId, text, images }) => {
      const receiver = getUser(receiverId);

      // The receiver may have no dashboard open. The message is still persisted
      // by POST /message/create-new-message, so dropping it here is safe.
      if (!receiver) return;

      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        text,
        images,
      });
    });

    socket.on("updateLastMessage", ({ lastMessage, lastMessageId }) => {
      const user = getUser(lastMessageId);

      if (!user) return;

      io.to(user.socketId).emit("updateLastMessage", { lastMessage });
    });

    socket.on("disconnect", () => {
      removeUser(io, socket.id);
    });
  });

  return io;
};

module.exports = initSocketServer;