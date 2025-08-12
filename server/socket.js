// socket.js
let ioRef = null;

export function initSocket(io) {
  ioRef = io;

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join:user", ({ userId }) => {
      if (typeof userId === "string" && userId.trim() !== "") {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined user room: ${userId}`);
      }
    });

    socket.on("join:courtDate", ({ courtId, date }) => {
      if (
        typeof courtId === "string" &&
        courtId.trim() !== "" &&
        typeof date === "string" &&
        date.trim() !== ""
      ) {
        const room = `court:${courtId}:${date}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  console.log("Socket.IO initialized");
}

export function getIO() {
  if (!ioRef) throw new Error("Socket.io not initialized");
  return ioRef;
}
