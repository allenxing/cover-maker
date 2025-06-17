"use client";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Transformer,
  Group,
  Line,
} from "react-konva";
// import { useKonvaSnapping } from "use-konva-snapping";
import { useKonvaSnapping } from "./useSnapping";

import { useState, useRef, useEffect } from "react";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { Stage as KonvaStage } from "konva/lib/Stage";
import { Node as KonvaNode, Node } from "konva/lib/Node";
import { Button } from "@/components/ui/button";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { Group as KonvaGroup } from "konva/lib/Group";

interface GuidLine {
  lineGuide: number;
  offset: number;
  orientation: "V" | "H";
  snap: string;
}
const stageSize = {
  width: 1000,
  height: 800,
};
// 需要根据stage size 来计算
const coverSize = {
  width: 800,
  height: 600,
};

const GUIDELINE_OFFSET = 10;

const GUIDELINE_COLOR = "#0099ff";

export default function CoverEditor({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  const transformerRef = useRef<KonvaTransformer>(null);
  const borderRef = useRef<KonvaTransformer>(null);
  const stageRef = useRef<KonvaStage>(null);
  const layerRef = useRef<KonvaLayer>(null);
  useEffect(() => {
    if (selectedNodes.length && transformerRef.current) {
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

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: Event | any) => {
      if (selectedNodes.length === 0) return;
      selectedNodes.forEach((node) => {
        e.preventDefault(); // 阻止默认行为
        switch (e.key) {
          case "ArrowLeft":
            node.x(node.x() - (e.ctrlKey ? 10 : 5));
            break;
          case "ArrowRight":
            node.x(node.x() + (e.ctrlKey ? 10 : 5));
            break;
          case "ArrowUp":
            node.y(node.y() - (e.ctrlKey ? 10 : 5));
            break;
          case "ArrowDown":
            node.y(node.y() + (e.ctrlKey ? 10 : 5));
            break;
          default:
            return;
        }
        node.getLayer().batchDraw();
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodes]);

  // https://konvajs.org/docs/select_and_transform/Basic_demo.html
  const handleStageClick = (event: any) => {
    // If click on empty area - remove all selections
    if (event.target === event.target.getStage()) {
      setSelectedNodes([]);
      return;
    }
    if (event.target.id() === "bg") {
      setSelectedNodes([]);
      return;
    }
    if (borderRef && borderRef.current) {
      borderRef.current.setNodes([]);
    }
    setSelectedNodes([event.target]);
  };

  const exportImage = () => {
    if (stageRef.current) {
      const cloneStage = stageRef.current.clone({
        nodes: stageRef.current?.find(
          (node: KonvaNode) => !(node instanceof KonvaTransformer)
        ),
      });

      // 生成克隆体的图像
      const dataURL = cloneStage.toDataURL({
        pixelRatio: 2,
        mimeType: "image/png",
        x: 100,
        y: 100,
        width: 800,
        height: 600,
      });
      cloneStage.destroy(); // 释放内存
      // const dataURL = stageRef.current.toDataURL({
      //   x: 100,
      //   pixelRatio: 2,
      //   mimeType: "image/png",
      // });
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "stage.png";
      link.click();
    }
  };
  const onStageEnter = (event: any) => {
    const node = event.target;
    if (node.id() === "bg" || node === node.getStage()) {
      return;
    }
    if (borderRef && borderRef.current) {
      if (transformerRef && transformerRef.current) {
        if (transformerRef.current.nodes().includes(node)) {
          return;
        }
      }
      borderRef.current.setNodes([node]);
    }
    // console.log("in", node);
  };
  const onStageOut = (event: any) => {
    if (
      event.target.id() === "bg" ||
      event.target === event.target.getStage()
    ) {
      return;
    }
    if (borderRef && borderRef.current) {
      borderRef.current.setNodes([]);
    }
    // console.log("out", event.target);
  };

  const [rects, setRects] = useState([
    { id: "1", x: 50, y: 50, width: 100, height: 50 },
    { id: "2", x: 200, y: 150, width: 100, height: 50 },
  ]);

  const [guidelines, setGuidelines] = useState<Array<GuidLine>>([]);
  const movingNode = useRef<KonvaNode>(null);
  const SNAP_THRESHOLD = 10;

  const handleSetSize = () => {
    const newRects = [...rects];
    newRects[1] = {
      ...newRects[1],
      height: 200,
    };
    setRects(newRects);
  };

  const { handleDragging, handleDragEnd, handleResizing, handleResizeEnd } =
    useKonvaSnapping({
      guidelineColor: "blue",
      guidelineDash: true,
      snapToStageCenter: true,
      snapRange: 5,
      guidelineThickness: 1,
      showGuidelines: true,
      snapToShapes: true,
      snapToStageBorders: true,
    });

  const handleSelect = (e: any) => {
    if (transformerRef.current) {
      transformerRef.current.nodes([e.target]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {children}
      <Button onClick={exportImage}>export</Button>
      <Button onClick={handleSetSize}>export</Button>
      {rects.map((item) => {
        return (
          <div key={item.id}>
            {item.x}: {item.y}--{item.width}: {item.height}
          </div>
        );
      })}
      <div>{JSON.stringify(guidelines)}</div>
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        ref={stageRef}
        onMouseOver={onStageEnter}
        onMouseOut={onStageOut}
      >
        <Layer
          ref={layerRef}
          // onDragMove={handleLayerDragMove}
          // onDragEnd={handleLayerDragEnd}
          x={(stageSize.width - coverSize.width) / 2}
          y={(stageSize.height - coverSize.height) / 2}
        >
          <Group
            id="rootGroup"
            clipWidth={coverSize.width}
            clipHeight={coverSize.height}
          >
            {/* cover size 800*600  */}
            <Rect
              id="bg"
              width={coverSize.width}
              height={coverSize.height}
              fill="gray"
            />
            {rects.map((rect) => (
              <Rect
                key={rect.id}
                id={rect.id}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill="#00D2FF"
                onClick={handleSelect}
                onDragMove={handleDragging}
                onDragEnd={handleDragEnd}
                draggable
              />
            ))}
          </Group>
          <Transformer
            ref={transformerRef}
            onTransform={handleResizing}
            onTransformEnd={handleResizeEnd}
            borderStroke="#000"
            borderStrokeWidth={2}
            anchorFill="#fff"
            anchorStroke="#000"
            anchorStrokeWidth={2}
            anchorSize={10}
            anchorCornerRadius={50}
          />
          {/* hover border */}
          <Transformer
            ref={borderRef}
            anchorStroke="transparent" // 隐藏控制点
            borderStroke="#4aadfb"
            borderDash={[5, 3]}
            enabledAnchors={[]} // 禁用拖拽功能
            rotateAnchorOffset={0}
            rotateEnabled={false}
          />
        </Layer>
      </Stage>
    </div>
  );
}
