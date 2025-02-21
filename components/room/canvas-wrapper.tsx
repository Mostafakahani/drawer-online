"use client";
import React from "react"; // import io from "socket.io-client";

import dynamic from "next/dynamic";

const DrawingBoard = dynamic(
  () => import("./drawing-board").then((mod) => mod.DrawingBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-pulse text-gray-600">
          Loading drawing board...
        </div>
      </div>
    ),
  }
);
interface CanvasWrapperProps {
  roomId: string;
}

export function CanvasWrapper({ roomId }: CanvasWrapperProps) {
  return <DrawingBoard roomId={roomId} />;
}
