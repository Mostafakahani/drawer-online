"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

// Import the Canvas component with no SSR
const ClientCanvas = dynamic(
  () => import("./Canvas").then((mod) => mod.Canvas),
  {
    ssr: false,
  }
);

// Correctly type the socket
type Socket = any;

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

export function DrawingBoard({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "text">("pen");
  const [color, setColor] = useState("#000000");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const userId = useRef(crypto.randomUUID());
  const currentLine = useRef<DrawingLine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  // Debug logger
  const log = useCallback((message: string) => {
    setDebugInfo((prev) => [message, ...prev].slice(0, 20));
    // console.log(message); // Add console logging for easier debugging
  }, []);

  // Update canvas size based on container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const smallestDimension = Math.min(
          container.offsetWidth,
          container.offsetHeight
        );
        setCanvasSize({
          width: smallestDimension,
          height: smallestDimension,
        });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Initialize socket.io and handle drawing events
  useEffect(() => {
    // Early exit for SSR
    if (typeof window === "undefined") return;

    let mounted = true;
    let socketInstance: any = null;

    setConnectionStatus("connecting");
    log(`Initializing connection for room: ${roomId}`);

    // Socket initialization function
    const initSocket = async () => {
      try {
        // Import socket.io-client properly
        const io = (await import("socket.io-client")).default;

        if (!mounted) return;

        // Create socket instance
        socketInstance = io(window.location.origin, {
          path: "/socket.io",
          query: { roomId },
          transports: ["websocket", "polling"],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        log("Socket.io client initialized");

        // Set up event handlers
        socketInstance.on("connect", () => {
          log(`Connected to socket server with ID: ${socketInstance.id}`);
          if (mounted) {
            setConnectionStatus("connected");
            socketInstance.emit("request-lines", roomId);
          }
        });

        socketInstance.on("connect_error", (err: Error) => {
          log(`Socket connection error: ${err.message}`);
          if (mounted) {
            setConnectionStatus("disconnected");
          }
        });

        socketInstance.on("current-lines", (serverLines: DrawingLine[]) => {
          log(`Received ${serverLines.length} lines from server`);
          if (mounted) {
            setLines(serverLines);
          }
        });

        socketInstance.on("line-update", (updatedLine: DrawingLine) => {
          log(`Received line update: ${updatedLine.id}`);
          if (mounted) {
            setLines((prevLines) => {
              const lineIndex = prevLines.findIndex(
                (line) => line.id === updatedLine.id
              );

              if (lineIndex !== -1) {
                const newLines = [...prevLines];
                newLines[lineIndex] = updatedLine;
                return newLines;
              } else {
                return [...prevLines, updatedLine];
              }
            });
          }
        });

        socketInstance.on("clear-canvas", (clearUserId: string) => {
          log(`Canvas cleared by user: ${clearUserId}`);
          if (mounted) {
            setLines([]);
          }
        });

        socketInstance.on("disconnect", (reason: string) => {
          log(`Disconnected from socket server: ${reason}`);
          if (mounted) {
            setConnectionStatus("disconnected");
          }
        });

        // Store the socket in state
        if (mounted) {
          setSocket(socketInstance);
        }
      } catch (error) {
        log(
          `Socket initialization error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        setConnectionStatus("disconnected");
      }
    };

    // Initialize socket
    initSocket();

    // Cleanup function
    return () => {
      mounted = false;
      if (socketInstance) {
        log("Cleaning up socket connection");
        socketInstance.disconnect();
      }
    };
  }, [roomId, log]);

  const createNewLine = useCallback(
    (point: Point): DrawingLine => {
      return {
        id: `${userId.current}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        points: [point],
        color,
        tool,
        userId: userId.current,
        text: tool === "text" ? "برای ویرایش دوبار کلیک کنید" : undefined,
      };
    },
    [color, tool]
  );

  const handleMouseDown = useCallback(
    (e: any) => {
      if (!socket || connectionStatus !== "connected") {
        log("Cannot draw: socket not connected");
        return;
      }

      const pos = e.target.getStage().getPointerPosition();
      const newLine = createNewLine(pos);

      log(`Creating new line: ${newLine.id}`);
      currentLine.current = newLine;
      setLines((prev) => [...prev, newLine]);
      setIsDrawing(true);

      // Send to server
      socket.emit("line-update", newLine);
    },
    [createNewLine, socket, connectionStatus, log]
  );

  const handleMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing || !currentLine.current || tool === "text" || !socket)
        return;

      const pos = e.target.getStage().getPointerPosition();
      const updatedLine = {
        ...currentLine.current,
        points: [...currentLine.current.points, pos],
      };

      currentLine.current = updatedLine;

      setLines((prevLines) => {
        return prevLines.map((line) =>
          line.id === updatedLine.id ? updatedLine : line
        );
      });

      // Send update to server
      socket.emit("line-update", updatedLine);
    },
    [isDrawing, tool, socket]
  );

  const handleMouseUp = useCallback(() => {
    if (currentLine.current && socket) {
      log(`Finishing line: ${currentLine.current.id}`);
      socket.emit("line-update", currentLine.current);
    }
    currentLine.current = null;
    setIsDrawing(false);
  }, [socket, log]);

  const handleTextDblClick = useCallback(
    (e: any, lineId: string) => {
      const line = lines.find((l) => l.id === lineId);
      if (!line || !socket) return;

      if (line.userId === userId.current) {
        const text = prompt("متن را وارد کنید:", line.text);
        if (text !== null) {
          const updatedLine = { ...line, text };

          setLines((prevLines) =>
            prevLines.map((l) => (l.id === lineId ? updatedLine : l))
          );

          socket.emit("line-update", updatedLine);
          log(`Updated text for line: ${lineId}`);
        }
      }
    },
    [lines, socket, log]
  );

  const clearCanvas = useCallback(() => {
    if (!socket) return;
    log("Clearing canvas");
    setLines([]);
    socket.emit("clear-canvas", userId.current);
  }, [socket, log]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="w-full px-4 py-3 bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                tool === "pen"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => setTool("pen")}
              disabled={connectionStatus !== "connected"}
            >
              مداد
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                tool === "text"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => setTool("text")}
              disabled={connectionStatus !== "connected"}
            >
              متن
            </button>
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                disabled={connectionStatus !== "connected"}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                connectionStatus === "connected"
                  ? "bg-green-100 text-green-700"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {connectionStatus === "connected"
                ? `متصل به اتاق: ${roomId}`
                : connectionStatus === "connecting"
                ? "در حال اتصال..."
                : "قطع ارتباط"}
            </span>

            {connectionStatus === "disconnected" && (
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => window.location.reload()}
              >
                اتصال مجدد
              </button>
            )}

            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              onClick={clearCanvas}
              disabled={connectionStatus !== "connected"}
            >
              پاک کردن
            </button>

            <button
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? "مخفی کردن اطلاعات دیباگ" : "نمایش اطلاعات دیباگ"}
            </button>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-gray-900 text-green-400 p-4 max-h-40 overflow-y-auto text-xs font-mono">
          <div className="max-w-6xl mx-auto">
            <div className="mb-2">
              <strong>وضعیت اتصال:</strong> {connectionStatus} |
              <strong> شناسه کاربر:</strong> {userId.current} |
              <strong> تعداد خطوط:</strong> {lines.length}
            </div>
            <div className="mb-2">
              <strong>آدرس سوکت:</strong>{" "}
              {process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin}
            </div>
            <ul>
              {debugInfo.map((info, i) => (
                <li key={i} className="mb-1">
                  [{new Date().toLocaleTimeString()}] {info}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div ref={containerRef} className="w-full h-full">
        {canvasSize.width > 0 && canvasSize.height > 0 && (
          <ClientCanvas
            lines={lines}
            canvasSize={canvasSize}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTextDblClick={handleTextDblClick}
          />
        )}
      </div>
    </div>
  );
}
