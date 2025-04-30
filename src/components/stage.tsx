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
  snap: number;
}

const coverSize = {
  width: 800,
  height: 600,
};

const GUIDELINE_OFFSET = 5;

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

  const [rects, setRects] = useState([
    { id: "1", x: 50, y: 50, width: 100, height: 50 },
    { id: "2", x: 200, y: 150, width: 100, height: 50 },
  ]);

  const [guidelines, setGuidelines] = useState<Array<GuidLine>>([]);
  const movingNode = useRef<KonvaNode>(null);
  const SNAP_THRESHOLD = 5;
  // 获取所有其他元素的边界
  // were can we snap our objects?
  const getLineGuideStops = (skipShape: KonvaNode) => {
    console.log("skipShape", skipShape);
    // we can snap to stage borders and the center of the stage
    if (!layerRef.current) {
      return;
    }
    const vertical: any = [0, coverSize.width / 2, coverSize.width];
    const horizontal: any = [0, coverSize.height / 2, coverSize.height];
    const groupNode: KonvaGroup | undefined = layerRef.current.findOne(
      (node: KonvaNode) => {
        return node.nodeType === "Group";
      }
    );
    if (!groupNode) {
      return;
    }
    // and we snap over edges and center of each object on the canvas
    console.log("groupNode children", groupNode.children);
    const nodes = groupNode.getChildren((node) => {
      // console.log("node", node.getAttr("name"));
      return node.getAttr("name") !== "line";
    });
    console.log("nodes", nodes.length);
    nodes.forEach((guideItem: KonvaNode) => {
      if (guideItem === skipShape) {
        // console.log("skipShape", guideItem);
        return;
      }
      console.log(1);
      const box = guideItem.getClientRect();
      // and we can snap to all edges of shapes
      vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
      horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
    });
    return {
      vertical: vertical.flat(),
      horizontal: horizontal.flat(),
    };
  };

  // what points of the object will trigger to snapping?
  // it can be just center of the object
  // but we will enable all edges and center
  const getObjectSnappingEdges = (node: KonvaNode) => {
    const box = node.getClientRect();
    const absPos = node.absolutePosition();

    return {
      vertical: [
        {
          guide: Math.round(box.x),
          offset: Math.round(absPos.x - box.x),
          snap: "start",
        },
        {
          guide: Math.round(box.x + box.width / 2),
          offset: Math.round(absPos.x - box.x - box.width / 2),
          snap: "center",
        },
        {
          guide: Math.round(box.x + box.width),
          offset: Math.round(absPos.x - box.x - box.width),
          snap: "end",
        },
      ],
      horizontal: [
        {
          guide: Math.round(box.y),
          offset: Math.round(absPos.y - box.y),
          snap: "start",
        },
        {
          guide: Math.round(box.y + box.height / 2),
          offset: Math.round(absPos.y - box.y - box.height / 2),
          snap: "center",
        },
        {
          guide: Math.round(box.y + box.height),
          offset: Math.round(absPos.y - box.y - box.height),
          snap: "end",
        },
      ],
    };
  };

  // find all snapping possibilities
  const getGuides = (lineGuideStops: any, itemBounds: any) => {
    const resultV: any = [];
    const resultH: any = [];

    lineGuideStops.vertical.forEach((lineGuide: any) => {
      itemBounds.vertical.forEach((itemBound: any) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        // if the distance between guild line and object snap point is close we can consider this for snapping
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide: any) => {
      itemBounds.horizontal.forEach((itemBound: any) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    const guides: GuidLine[] = [];

    // find closest snap
    const minV = resultV.sort((a: any, b: any) => a.diff - b.diff)[0];
    const minH = resultH.sort((a: any, b: any) => a.diff - b.diff)[0];
    if (minV) {
      guides.push({
        lineGuide: minV.lineGuide,
        offset: minV.offset,
        orientation: "V",
        snap: minV.snap,
      });
    }
    if (minH) {
      guides.push({
        lineGuide: minH.lineGuide,
        offset: minH.offset,
        orientation: "H",
        snap: minH.snap,
      });
    }
    return guides;
  };

  const handleLayerDragMove = (e: any) => {
    const node = e.target;
    if (node instanceof KonvaTransformer) {
      return;
    }
    setGuidelines([]);
    const lineGuideStops = getLineGuideStops(node);
    console.log("lineGuideStops", lineGuideStops);
    // find snapping points of current object
    const itemBounds = getObjectSnappingEdges(node);
    // now find where can we snap current object
    const guidelines: GuidLine[] = getGuides(lineGuideStops, itemBounds);
    console.log("guidelines", guidelines);
    // do nothing of no snapping
    if (guidelines.length === 0) {
      return;
    }
    setGuidelines(guidelines);
    const absPos = node.absolutePosition();
    // now force object position
    guidelines.forEach((lg) => {
      switch (lg.orientation) {
        case "V": {
          absPos.x = lg.lineGuide + lg.offset;
          break;
        }
        case "H": {
          absPos.y = lg.lineGuide + lg.offset;
          break;
        }
      }
    });
    node.absolutePosition(absPos);
    movingNode.current = node;
  };

  const handleLayerDragEnd = () => {
    // 更新状态保存新位置
    if (!movingNode.current) {
      return;
    }
    if (movingNode && movingNode.current) {
      const index = rects.findIndex(
        (r) => r.id === (movingNode.current && movingNode.current.id())
      );
      const newRects = [...rects];
      newRects[index] = {
        ...newRects[index],
        x: movingNode.current.x(),
        y: movingNode.current.y(),
      };
      setRects(newRects);
      setGuidelines([]);
    }
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
        <Layer
          ref={layerRef}
          onDragMove={handleLayerDragMove}
          onDragEnd={handleLayerDragEnd}
          clipX={100}
          clipY={100}
        >
          {/* <Text text="Try to drag shapes" fontSize={15} /> */}
          {/* cover size 800*600  */}
          <Rect
            id="bg"
            width={coverSize.width}
            height={coverSize.height}
            fill="gray"
          />
          <Group
            id="rootGroup"
            clipWidth={coverSize.width}
            clipHeight={coverSize.height}
          >
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
            {rects.map((rect) => (
              <Rect
                key={rect.id}
                id={rect.id}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill="#00D2FF"
                draggable
                // onDragMove={handleDragMove}
                // onDragEnd={handleDragEnd}
              />
            ))}
            {/* 绘制提示线 */}
            {guidelines.map((line, i) => {
              if (line.orientation === "H") {
                return (
                  <Line
                    key={i}
                    name="line"
                    points={[-6000, 0, 6000, 0]}
                    stroke="red"
                    strokeWidth={1}
                    x={0}
                    y={line.lineGuide}
                  />
                );
              }
              return (
                <Line
                  key={i}
                  name="line"
                  points={[0, -6000, 0, 6000]}
                  stroke="red"
                  strokeWidth={1}
                  x={line.lineGuide}
                  y={0}
                />
              );
            })}
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
