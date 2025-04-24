"use client";
import { Stage, Layer, Rect, Circle, Text } from "react-konva";
import { useState } from "react";

export default function CoverEditor({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {children}
      <Stage width={500} height={500}>
        <Layer>
          {/* <Text text="Try to drag shapes" fontSize={15} /> */}
          <Rect
            x={20}
            y={50}
            width={100}
            height={100}
            fill="red"
            shadowBlur={10}
            draggable
          />
          <Circle x={200} y={100} radius={50} fill="green" draggable />
        </Layer>
      </Stage>
    </div>
  );
}
