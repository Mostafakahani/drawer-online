import { CanvasWrapper } from "@/components/room/canvas-wrapper";
import React from "react";
interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { roomId } = await params;
  return (
    <div>
      <h1>Room {roomId}</h1>
      <CanvasWrapper roomId={roomId} />
    </div>
  );
}
