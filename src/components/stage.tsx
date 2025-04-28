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
import { Node as KonvaNode } from "konva/lib/Node";
import { Button } from "@/components/ui/button";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";

export default function CoverEditor({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  const transformerRef = useRef<KonvaTransformer>(null);
  const borderRef = useRef<KonvaTransformer>(null);
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
      setSelectedNodes([]);
      return;
    }
    // if (borderRef && borderRef.current) {
    //   borderRef.current.hide();
    // }
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

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {children}
      <Button onClick={exportImage}>export</Button>
      <Stage
        width={1000}
        height={800}
        onClick={handleStageClick}
        ref={stageRef}
        onMouseOver={onStageEnter}
        onMouseOut={onStageOut}
      >
        {/* <Layer>
          <Rect x={20} y={50} width={500} height={500} fill="blue" />
        </Layer> */}
        <Layer>
          {/* <Text text="Try to drag shapes" fontSize={15} /> */}
          {/* cover size 800*600  */}
          <Rect id="bg" x={100} y={100} width={800} height={600} fill="gray" />
          <Group clipX={100} clipY={100} clipWidth={800} clipHeight={600}>
            <Rect
              x={100}
              y={100}
              width={100}
              height={100}
              fill="red"
              shadowBlur={10}
              draggable
            />
            <Circle
              x={250}
              y={150}
              radius={50}
              fill="green"
              draggable
              stroke={"black"}
            />
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
