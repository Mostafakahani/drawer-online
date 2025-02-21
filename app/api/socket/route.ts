// app/api/socket/route.ts
import { NextResponse } from "next/server";
import { Server as SocketServer } from "socket.io";

interface Point {
  x: number;
  y: number;
}

interface DrawingLine {
  id: string;
  points: Point[];
  color: string;
  tool: "pen" | "text";
  text?: string;
  userId: string;
}

// Store drawings for each room
const roomDrawings = new Map<string, DrawingLine[]>();

let io: SocketServer;

export async function GET() {
  if (!io) {
    console.log("Initializing Socket.io server...");
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    io = new SocketServer(8000, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      const roomId = socket.handshake.query.roomId as string;
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
          console.log(
            `Current lines count: ${roomDrawings.get(roomId)?.length || 0}`
          );
          socket.emit("current-lines", roomDrawings.get(roomId) || []);
        });

        // Handle line updates
        socket.on("line-update", (line: DrawingLine) => {
          // console.log(`Line update in room ${roomId}, line ID: ${line.id}`);
          const drawings = roomDrawings.get(roomId) || [];

          // Find and replace existing line or add new one
          const existingIndex = drawings.findIndex((l) => l.id === line.id);
          if (existingIndex >= 0) {
            drawings[existingIndex] = line;
          } else {
            drawings.push(line);
          }

          roomDrawings.set(roomId, drawings);

          // Broadcast to all clients in the room (including sender for confirmation)
          io.to(roomId).emit("line-update", line);
        });

        // Handle canvas clearing
        socket.on("clear-canvas", (userId: string) => {
          console.log(`Canvas cleared in room ${roomId} by ${userId}`);
          roomDrawings.set(roomId, []);
          io.to(roomId).emit("clear-canvas", userId);
        });

        socket.on("disconnect", () => {
          console.log(`Client disconnected from room: ${roomId}`);
        });
      }
    });
  }

  return NextResponse.json({ message: "Socket server is running" });
}
