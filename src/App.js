import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Arrow } from "react-konva";
import useImage from "use-image";

export default function Annotator() {
  const urlParams = new URLSearchParams(window.location.search);
  let imageUrl = urlParams.get("image") || "";

  // Convert Google Drive share link to direct image link
  if (imageUrl.includes("drive.google.com/file/d/")) {
    const fileId = imageUrl.split("/d/")[1]?.split("/")[0];
    if (fileId) {
      imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

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

  const getPointerPosition = (e) => e.target.getStage().getPointerPosition();

  const startDrawing = (e) => {
    if (selectedArrowIndex !== null) {
      setSelectedArrowIndex(null);
      return;
    }
    setIsDrawing(true);
    const pos = getPointerPosition(e);
    if (pos) {
      setNewArrow([pos.x / scale, pos.y / scale]);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getPointerPosition(e);
    if (pos) {
      setNewArrow((prev) => [prev[0], prev[1], pos.x / scale, pos.y / scale]);
    }
  };

  const endDrawing = () => {
    if (newArrow.length === 4) {
      setArrows((prev) => [...prev, newArrow]);
    }
    setIsDrawing(false);
    setNewArrow([]);
  };

  const handleArrowClick = (index) => {
    setSelectedArrowIndex(index);
  };

  const handleExport = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "annotated-image.png";
    link.href = uri;
    link.click();
  };

  const handleUndo = () => {
    setArrows((prev) => prev.slice(0, -1));
    setSelectedArrowIndex(null);
  };

  const handleDelete = () => {
    if (selectedArrowIndex !== null) {
      setArrows((prev) => prev.filter((_, i) => i !== selectedArrowIndex));
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
          onMouseDown={startDrawing}
          onTouchStart={startDrawing}
          onMouseMove={draw}
          onTouchMove={draw}
          onMouseUp={endDrawing}
          onTouchEnd={endDrawing}
          style={{ border: "1px solid #ccc" }}
        >
          <Layer>
            <KonvaImage image={image} width={image.width} height={image.height} />
            {arrows.map((arrow, i) => (
              <>
                <Arrow
                  key={`outline-${i}`}
                  points={arrow}
                  pointerLength={6}
                  pointerWidth={6}
                  fill="white"
                  stroke="white"
                  strokeWidth={6}
                />
                <Arrow
                  key={`main-${i}`}
                  points={arrow}
                  pointerLength={6}
                  pointerWidth={6}
                  fill={i === selectedArrowIndex ? "blue" : "red"}
                  stroke={i === selectedArrowIndex ? "blue" : "red"}
                  strokeWidth={4}
                  onClick={() => handleArrowClick(i)}
                  onTap={() => handleArrowClick(i)}
                />
              </>
            ))}
            {newArrow.length === 4 && (
              <>
                <Arrow
                  points={newArrow}
                  pointerLength={6}
                  pointerWidth={6}
                  fill="white"
                  stroke="white"
                  strokeWidth={6}
                />
                <Arrow
                  points={newArrow}
                  pointerLength={6}
                  pointerWidth={6}
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
