import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Arrow, Group } from "react-konva";
import useImage from "use-image";

export default function Annotator() {
  const urlParams = new URLSearchParams(window.location.search);
  const imageUrl = urlParams.get("image") || "";

  const [image, status] = useImage(imageUrl, "anonymous");
  const [arrows, setArrows] = useState([]);
  const [newArrow, setNewArrow] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedArrowIndex, setSelectedArrowIndex] = useState(null);
  const [scale, setScale] = useState(1);

  const stageRef = useRef(null);

  useEffect(() => {
    if (image) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight - 150;
      const scaleX = screenWidth / image.width;
      const scaleY = screenHeight / image.height;
      setScale(Math.min(scaleX, scaleY));
    }
  }, [image]);

  const handleMouseDown = (e) => {
    if (selectedArrowIndex !== null) {
      setSelectedArrowIndex(null);
      return;
    }
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setNewArrow([pos.x / scale, pos.y / scale]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const pos = e.target.getStage().getPointerPosition();
    setNewArrow((prev) => [prev[0], prev[1], pos.x / scale, pos.y / scale]);
  };

  const handleMouseUp = () => {
    if (newArrow.length === 4) {
      setArrows([...arrows, newArrow]);
    }
    setIsDrawing(false);
    setNewArrow([]);
  };

  const handleArrowClick = (index) => {
    setSelectedArrowIndex(index);
  };

  const handleDragMove = (e, index) => {
    const node = e.target;
    const newPoints = [
      node.x(),
      node.y(),
      node.x() + node.getAttr("dx"),
      node.y() + node.getAttr("dy"),
    ];
    const updated = [...arrows];
    updated[index] = newPoints;
    setArrows(updated);
  };

  const handleExport = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "annotated-image.png";
    link.href = uri;
    link.click();
  };

  const handleUndo = () => {
    setArrows(arrows.slice(0, -1));
  };

  const handleDelete = () => {
    if (selectedArrowIndex !== null) {
      const updated = arrows.filter((_, i) => i !== selectedArrowIndex);
      setArrows(updated);
      setSelectedArrowIndex(null);
    }
  };

  const handleClear = () => {
    setArrows([]);
    setSelectedArrowIndex(null);
  };

  if (status === "loading") return <p>Loading image...</p>;
  if (status === "failed") return <p>Image failed to load. Check the URL.</p>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 10 }}>
        <button onClick={handleExport}>Download</button>
        <button onClick={handleUndo} disabled={arrows.length === 0}>Undo</button>
        <button onClick={handleDelete} disabled={selectedArrowIndex === null}>Delete</button>
        <button onClick={handleClear} disabled={arrows.length === 0}>Clear All</button>
      </div>

      {image ? (
        <Stage
          width={image.width * scale}
          height={image.height * scale}
          scaleX={scale}
          scaleY={scale}
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ border: "1px solid #ccc" }}
        >
          <Layer>
            <KonvaImage image={image} width={image.width} height={image.height} />
            {arrows.map((arrow, i) => (
              <Group key={i}>
                <Arrow
                  points={arrow}
                  pointerLength={10}
                  pointerWidth={10}
                  fill="white"
                  stroke="white"
                  strokeWidth={8}
                />
                <Arrow
                  points={arrow}
                  pointerLength={10}
                  pointerWidth={10}
                  fill={i === selectedArrowIndex ? "blue" : "red"}
                  stroke={i === selectedArrowIndex ? "blue" : "red"}
                  strokeWidth={4}
                  onClick={() => handleArrowClick(i)}
                  draggable={i === selectedArrowIndex}
                  onDragMove={(e) => handleDragMove(e, i)}
                  dx={arrow[2] - arrow[0]}
                  dy={arrow[3] - arrow[1]}
                />
              </Group>
            ))}
            {newArrow.length === 4 && (
              <>
                <Arrow
                  points={newArrow}
                  pointerLength={10}
                  pointerWidth={10}
                  fill="white"
                  stroke="white"
                  strokeWidth={8}
                />
                <Arrow
                  points={newArrow}
                  pointerLength={10}
                  pointerWidth={10}
                  fill="red"
                  stroke="red"
                  strokeWidth={4}
                />
              </>
            )}
          </Layer>
        </Stage>
      ) : (
        <p>No image loaded. Add ?image=YOUR_IMAGE_URL to the URL.</p>
      )}
    </div>
  );
}
