// server.mjs
import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import next from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Store drawings for each room
const roomDrawings = new Map();

nextApp.prepare().then(() => {
  const app = express();
  const server = createServer(app);

  // Initialize Socket.IO
  const io = new SocketServer(server, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    const roomId = socket.handshake.query.roomId;
    console.log(`Client connected to room: ${roomId}`);

    if (roomId) {
      socket.join(roomId);

      // Initialize room if not exists
      if (!roomDrawings.has(roomId)) {
        roomDrawings.set(roomId, []);
      }

      // Handle request for current lines
      socket.on("request-lines", () => {
        console.log(`Sending current lines for room ${roomId}`);
        socket.emit("current-lines", roomDrawings.get(roomId) || []);
      });

      // Handle line updates
      socket.on("line-update", (line) => {
        const drawings = roomDrawings.get(roomId) || [];
        const existingIndex = drawings.findIndex((l) => l.id === line.id);

        if (existingIndex >= 0) {
          drawings[existingIndex] = line;
        } else {
          drawings.push(line);
        }

        roomDrawings.set(roomId, drawings);
        io.to(roomId).emit("line-update", line);
      });

      // Handle canvas clearing
      socket.on("clear-canvas", (userId) => {
        console.log(`Canvas cleared in room ${roomId} by ${userId}`);
        roomDrawings.set(roomId, []);
        io.to(roomId).emit("clear-canvas", userId);
      });

      socket.on("disconnect", () => {
        console.log(`Client disconnected from room: ${roomId}`);
      });
    }
  });

  // API Routes
  app.get("/api/socket", (req, res) => {
    res.json({ message: "Socket server is running" });
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      rooms: Array.from(roomDrawings.keys()),
      connections: io.engine.clientsCount,
    });
  });

  // Handle all other routes with Next.js
  app.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
