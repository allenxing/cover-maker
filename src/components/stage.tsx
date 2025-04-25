"use client";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Transformer,
  Group,
} from "react-konva";
import { useState, useRef, useEffect } from "react";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { Stage as KonvaStage } from "konva/lib/Stage";

import { Button } from "@/components/ui/button";

export default function CoverEditor({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  const transformerRef = useRef<KonvaTransformer>(null);
  const stageRef = useRef<KonvaStage>(null);
  useEffect(() => {
    if (selectedNodes.length && transformerRef.current) {
      // const nodes = selectedNodes.map((id) => {
      //   console.log(id);
      //   const node = stageRef.current?.findOne(`${id}`);
      //   console.log(node);
      //   return node;
      // });
      if (transformerRef.current) {
        transformerRef.current.setNodes(selectedNodes);
      }
    } else if (transformerRef.current) {
      // Clear selection
      if (transformerRef.current) {
        transformerRef.current.setNodes([]);
      }
    }
  }, [selectedNodes]);
  // https://konvajs.org/docs/select_and_transform/Basic_demo.html
  const handleStageClick = (event: any) => {
    // If click on empty area - remove all selections
    if (event.target === event.target.getStage()) {
      setSelectedNodes([]);
      return;
    }
    if (event.target.id() === "bg") {
      return;
    }
    setSelectedNodes([event.target]);
  };

  const exportImage = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({
        x: 100,
        pixelRatio: 2,
        mimeType: "image/png",
      });
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "stage.png";
      link.click();
    }
  };
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {children}
      <Button onClick={exportImage}>export</Button>
      <Stage width={500} height={500} onClick={handleStageClick} ref={stageRef}>
        {/* <Layer>
          <Rect x={20} y={50} width={500} height={500} fill="blue" />
        </Layer> */}
        <Layer>
          {/* <Text text="Try to drag shapes" fontSize={15} /> */}
          <Rect
            id="bg"
            x={100}
            y={100}
            width={500}
            height={500}
            fill="blue"
            disabled
          />
          <Group clipX={100} clipY={100} clipWidth={500} clipHeight={500}>
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
          </Group>
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}
