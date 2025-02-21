"use client";

import React from "react";
import { Stage, Layer, Line, Text } from "react-konva";

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

interface CanvasProps {
  lines: DrawingLine[];
  canvasSize: { width: number; height: number };
  onMouseDown: (e: any) => void;
  onMouseMove: (e: any) => void;
  onMouseUp: () => void;
  onTextDblClick: (e: any, lineId: string) => void;
}

// This component only renders on the client
export const Canvas: React.FC<CanvasProps> = ({
  lines,
  canvasSize,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTextDblClick,
}) => {
  return (
    <Stage
      width={canvasSize.width}
      height={canvasSize.height}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchStart={onMouseDown}
      onTouchMove={onMouseMove}
      onTouchEnd={onMouseUp}
    >
      <Layer>
        {lines.map((line) =>
          line.tool === "pen" ? (
            <Line
              key={line.id}
              points={line.points.flatMap((p) => [p.x, p.y])}
              stroke={line.color}
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          ) : (
            <Text
              key={line.id}
              x={line.points[0].x}
              y={line.points[0].y}
              text={line.text || ""}
              fontSize={20}
              fill={line.color}
              onDblClick={(e) => onTextDblClick(e, line.id)}
            />
          )
        )}
      </Layer>
    </Stage>
  );
};
