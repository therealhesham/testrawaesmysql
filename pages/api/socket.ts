import { Server } from "socket.io";

export default function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).send("Socket server is running");
  }

  if (req.method === "POST") {
    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      console.log("a user connected");

      // Track user status
      socket.on("userStatus", (username, status) => {
        socket.broadcast.emit("userStatus", { [username]: status });
      });

      // Send message event
      socket.on("sendMessage", (msg) => {
        io.emit("message", msg); // Broadcast message to all clients
        io.emit("newNotification", `New message: ${msg}`); // Notify all clients about the new message
      });

      // Track online users
      socket.on("join", (username) => {
        socket.username = username;
        socket.broadcast.emit("onlineUsers", [
          ...Object.keys(io.sockets.sockets),
        ]);
      });

      socket.on("disconnect", () => {
        console.log("a user disconnected");
        socket.broadcast.emit("onlineUsers", [
          ...Object.keys(io.sockets.sockets),
        ]);
      });
    });

    res.socket.server.io = io;
    res.end();
  }
}
