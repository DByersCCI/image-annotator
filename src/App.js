import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Arrow } from "react-konva";
import useImage from "use-image";

export default function Annotator() {
  const urlParams = new URLSearchParams(window.location.search);
  let imageUrl = urlParams.get("image") || "";

  const [finalImageUrl, setFinalImageUrl] = useState(null);
  const [image, status] = useImage(finalImageUrl);
  const [arrows, setArrows] = useState([]);
  const [newArrow, setNewArrow] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedArrowIndex, setSelectedArrowIndex] = useState(null);
  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);

  useEffect(() => {
    async function resolveImageUrl() {
      if (!imageUrl) return;

      if (imageUrl.startsWith("data:image")) {
        setFinalImageUrl(imageUrl);
      } else {
        try {
          const response = await fetch(imageUrl);
          const base64 = await response.text();
          if (base64.startsWith("data:image")) {
            setFinalImageUrl(base64);
          } else {
            console.error("Returned value is not a valid Base64 image");
          }
        } catch (err) {
          console.error("Failed to fetch image from URL", err);
        }
      }
    }
    resolveImageUrl();
  }, [imageUrl]);

  useEffect(() => {
    if (image) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight - 150;

      const margin = 20;

      const margin = 20;
      const maxWidth = screenWidth - margin * 2;
      const maxHeight = screenHeight - margin * 2;
      const scaleX = maxWidth / image.width;
      const scaleY = maxHeight / image.height;
      
      // Prevent upscaling past 1.0 (100%) to avoid blurry images
      const fitScale = Math.min(scaleX, scaleY, 1);
      
      setScale(fitScale);

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
      const [x1, y1, x2, y2] = newArrow;
      setArrows((prev) => [...prev, [x2, y2, x1, y1]]);
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

  const handleSave = async () => {
    if (!imageUrl || !stageRef.current) return;

    const dataUrl = stageRef.current.toDataURL({
      mimeType: "image/jpeg",
      quality: 0.92,
    });

    const base64 = dataUrl.split(",")[1];
    const originalFileName = decodeURIComponent(imageUrl.split("file=")[1]);

    try {
      
        await fetch(
        "https://script.google.com/macros/s/AKfycbz4Vi2yI3bnY1g5hw_K1WKiaqnPRK22XBcFF4G2Inju-9XoWfk_yXDfI2570zzA5pkM/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            originalFileName,
            base64Image: base64,
          }),
          mode: "no-cors",
        }
      );

      alert("✅ Upload attempted. Check Google Drive to confirm.");
    } catch (err) {
      console.error("Upload failed", err);
      alert("🚨 Upload error: " + err.message);
    }
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
    <div style={{ padding: 20, touchAction: "manipulation" }}>
  
      <div style={{ marginBottom: 10 }}>
        <button onClick={handleExport}>Download</button>
        <button onClick={handleSave}>Save to App</button>
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