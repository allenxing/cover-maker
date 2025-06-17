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
  const [snapLines, setSnapLines] = useState<any>([]);
  const movingNode = useRef<KonvaNode>(null);
  const SNAP_THRESHOLD = 10;
  // 获取所有其他元素的边界
  // were can we snap our objects?
  const getLineGuideStops = (skipShape: KonvaNode) => {
    // console.log("skipShape", skipShape);
    // we can snap to stage borders and the center of the stage
    if (!layerRef.current) {
      return;
    }
    const vertical: any = [
      0,
      coverSize.width / 2 + (stageSize.width - coverSize.width) / 2,
      coverSize.width,
    ];
    const horizontal: any = [
      0,
      coverSize.height / 2 + (stageSize.height - coverSize.height) / 2,
      coverSize.height,
    ];
    const groupNode: KonvaGroup | undefined = layerRef.current.findOne(
      (node: KonvaNode) => {
        return node.nodeType === "Group";
      }
    );
    if (!groupNode) {
      return;
    }
    // and we snap over edges and center of each object on the canvas
    // console.log("groupNode children", groupNode.children);
    const nodes = groupNode.getChildren((node) => {
      // console.log("node", node.getAttr("name"));
      return node.getAttr("name") !== "line";
    });
    // console.log("nodes", nodes.length);
    nodes.forEach((guideItem: KonvaNode) => {
      if (guideItem === skipShape) {
        // console.log("skipShape", guideItem);
        return;
      }
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
    // console.log("absolutePosition", absPos);
    // console.log("Position", node.position());
    // console.log("box", box);

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

  const checkGuides = (node: KonvaNode) => {
    const lineGuideStops = getLineGuideStops(node);
    // console.log("lineGuideStops", lineGuideStops);
    // find snapping points of current object
    const itemBounds = getObjectSnappingEdges(node);
    // now find where can we snap current object
    const guidelines: GuidLine[] = getGuides(lineGuideStops, itemBounds);
    // console.log("guidelines", guidelines);
    return guidelines;
  };

  const checkSnapping = (currentNode: KonvaNode) => {
    const newLines = [];
    const box = currentNode.getClientRect();

    // 检测画布边界吸附
    if (Math.abs(box.x) < SNAP_THRESHOLD) {
      newLines.push({
        points: [0, box.y, 0, box.y + box.height],
        direction: "vertical",
      });
    }
    if (Math.abs(box.y) < SNAP_THRESHOLD) {
      newLines.push({
        points: [box.x, 0, box.x + box.width, 0],
        direction: "horizontal",
      });
    }

    // 检测其他元素吸附
    rects.forEach((element) => {
      if (element.id === currentNode.id()) return;

      const targetBox = {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      };

      // 水平方向检测
      const horizontalDiffs = [
        Math.abs(box.x - targetBox.x),
        Math.abs(box.x + box.width - targetBox.x),
        Math.abs(box.x - (targetBox.x + targetBox.width)),
        Math.abs(box.x + box.width - (targetBox.x + targetBox.width)),
      ];

      const minHorizontal = Math.min(...horizontalDiffs);
      if (minHorizontal < SNAP_THRESHOLD) {
        newLines.push({
          points: [targetBox.x, box.y, targetBox.x, box.y + box.height],
          direction: "vertical",
        });
      }

      // 垂直方向检测
      const verticalDiffs = [
        Math.abs(box.y - targetBox.y),
        Math.abs(box.y + box.height - targetBox.y),
        Math.abs(box.y - (targetBox.y + targetBox.height)),
        Math.abs(box.y + box.height - (targetBox.y + targetBox.height)),
      ];

      const minVertical = Math.min(...verticalDiffs);
      if (minVertical < SNAP_THRESHOLD) {
        newLines.push({
          points: [box.x, targetBox.y, box.x + box.width, targetBox.y],
          direction: "horizontal",
        });
      }
    });

    setSnapLines(newLines);
    return newLines;
  };

  const handleLayerDragMove = (e: any) => {
    const node = e.target;
    if (node instanceof KonvaTransformer) {
      return;
    }
    setGuidelines([]);
    // const lineGuideStops = getLineGuideStops(node);
    // console.log("lineGuideStops", lineGuideStops);
    // // find snapping points of current object
    // const itemBounds = getObjectSnappingEdges(node);
    // // now find where can we snap current object
    // const guidelines: GuidLine[] = getGuides(lineGuideStops, itemBounds);
    // console.log("guidelines", guidelines);
    const guidelines = checkGuides(node);
    // do nothing of no snapping
    if (!guidelines || guidelines.length === 0) {
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
      console.log("drag end");
    }
  };

  const handleTransform = (e: any) => {
    // console.log("transform", e.target);
    // const node: KonvaNode = selectedNodes[0];
    // const scaleX = node.scaleX();
    // const scaleY = node.scaleY();
    // // 应用吸附逻辑
    // const snappedLines = checkSnapping(node);
    // console.log("snappedLines", snappedLines);
    // if (snappedLines.length > 0) {
    //   const line: any = snappedLines[0];
    //   if (line.direction === "horizontal") {
    //     node.y(line.points[1]);
    //     node.scaleY(1);
    //   } else {
    //     node.x(line.points[0]);
    //     node.scaleX(1);
    //   }
    // }
    // // 更新元素状态
    // setRects(
    //   rects.map((el) => {
    //     if (el.id === node.id()) {
    //       return {
    //         ...el,
    //         x: node.x(),
    //         y: node.y(),
    //         width: node.width() * scaleX,
    //         height: node.height() * scaleY,
    //       };
    //     }
    //     return el;
    //   })
    // );
  };
  const handleSetSize = () => {
    const newRects = [...rects];
    newRects[1] = {
      ...newRects[1],
      height: 200,
    };
    setRects(newRects);
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
        // offsetX={-100}
      >
        {/* <Layer>
          <Rect x={20} y={50} width={500} height={500} fill="blue" />
        </Layer> */}
        <Layer
          ref={layerRef}
          onDragMove={handleLayerDragMove}
          onDragEnd={handleLayerDragEnd}
          // clipWidth={coverSize.width}
          // clipHeight={coverSize.height}
          // clipX={100}
          // clipY={100}
          x={(stageSize.width - coverSize.width) / 2}
          y={(stageSize.height - coverSize.height) / 2}
          // offetY={-(800 - coverSize.height) / 2}
        >
          {/* <Text text="Try to drag shapes" fontSize={15} /> */}
          {/* cover size 800*600  */}
          <Rect
            id="bg"
            width={coverSize.width}
            height={coverSize.height}
            fill="gray"
          />
          {/* <Rect
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
          /> */}
          <Group
            id="rootGroup"
            clipWidth={coverSize.width}
            clipHeight={coverSize.height}
          >
            {/* <Rect
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
            /> */}
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
                    y={
                      line.lineGuide - (stageSize.height - coverSize.height) / 2
                    }
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
                  x={line.lineGuide - (stageSize.width - coverSize.width) / 2}
                  y={0}
                />
              );
            })}
            {/* 绘制吸附线 */}
            {snapLines.map((line: any, i: number) => (
              <Line
                key={i}
                points={line.points}
                stroke={GUIDELINE_COLOR}
                strokeWidth={1}
                dash={[4, 4]}
              />
            ))}
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
            anchorDragBoundFunc={(oldPos, newPos, event) => {
              console.log("当前guidelines状态:", guidelines); // 添加调试日志
              const guideLines = checkGuides(selectedNodes[0]);
              setGuidelines([]);
              if (guideLines.length > 0) {
                // 直接使用checkGuides的返回值而不是state
                console.log(33333);
                // 如果需要更新state
                setGuidelines(guideLines);
              }
              let postion: any = newPos;
              console.log(transformerRef.current);
              if (transformerRef.current) {
                // transformerRef.current.setNodes(selectedNodes);
                const anchor = transformerRef.current.getActiveAnchor() || "";
                console.log(transformerRef.current.getActiveAnchor());
                guideLines.forEach((line) => {
                  if (line.orientation === "H") {
                    const logicClosestX = line.lineGuide - line.offset; // 计算吸附后的y坐标
                    const logicDiffX = Math.abs(newPos.x - logicClosestX); // x磁贴偏移量
                    const snappedX =
                      /-(left|right)$/.test(anchor) &&
                      logicDiffX < SNAP_THRESHOLD; // x磁贴阈值
                    postion = {
                      x: logicClosestX,
                      y: oldPos.y,
                    };
                  }
                  // if (line.orientation === "V") {
                  //   newPos.x = line.lineGuide - (stageSize.width - coverSize.width) / 2;
                });
              }
              return postion;
            }}
            onTransform={handleTransform}
            onTransformEnd={() => {
              if (layerRef.current) {
                layerRef.current.batchDraw();
              }
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
