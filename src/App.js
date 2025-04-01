import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Arrow, Text } from "react-konva";
import useImage from "use-image";
import { Button } from "@/components/ui/button";

export default function Annotator() {
  const urlParams = new URLSearchParams(window.location.search);
  const imageUrl = urlParams.get("image") || "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/House_Front.jpg/640px-House_Front.jpg";
  const [image] = useImage(imageUrl);
  const [arrows, setArrows] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newArrow, setNewArrow] = useState([]);
  const stageRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setNewArrow([pos.x, pos.y]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const pos = e.target.getStage().getPointerPosition();
    setNewArrow((prev) => [prev[0], prev[1], pos.x, pos.y]);
  };

  const handleMouseUp = () => {
    if (newArrow.length === 4) {
      setArrows([...arrows, newArrow]);
    }
    setIsDrawing(false);
    setNewArrow([]);
  };

  const handleExport = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "annotated-image.png";
    link.href = uri;
    link.click();
  };

  return (
    <div className="flex flex-col items-center p-4">
      <Stage
        width={image?.width || 600}
        height={image?.height || 400}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="border"
      >
        <Layer>
          {image && <KonvaImage image={image} />}
          {arrows.map((arrow, i) => (
            <Arrow
              key={i}
              points={arrow}
              pointerLength={10}
              pointerWidth={10}
              fill="red"
              stroke="red"
              strokeWidth={4}
            />
          ))}
          {newArrow.length === 4 && (
            <Arrow
              points={newArrow}
              pointerLength={10}
              pointerWidth={10}
              fill="red"
              stroke="red"
              strokeWidth={4}
            />
          )}
        </Layer>
      </Stage>
      <Button onClick={handleExport} className="mt-4">Download Annotated Image</Button>
    </div>
  );
}
