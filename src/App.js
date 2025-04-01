import { useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Arrow } from "react-konva";
import useImage from "use-image";

export default function Annotator() {
  const urlParams = new URLSearchParams(window.location.search);
  const imageUrl = urlParams.get("image") || "";

  const [image, status] = useImage(imageUrl, "anonymous"); // <-- added crossorigin mode
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

  if (status === "loading") return <p>Loading image...</p>;
  if (status === "failed") return <p>Image failed to load. Check the URL.</p>;

  return (
    <div style={{ padding: 20 }}>
      {image ? (
        <>
          <Stage
            width={image.width}
            height={image.height}
            ref={stageRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              <KonvaImage image={image} />
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
          <button
            onClick={handleExport}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
          >
            Download Annotated Image
          </button>
        </>
      ) : (
        <p>No image loaded. Add ?image=YOUR_IMAGE_URL to the URL.</p>
      )}
    </div>
  );
}
