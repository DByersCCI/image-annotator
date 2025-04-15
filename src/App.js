import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Arrow } from "react-konva";
import useImage from "use-image";

export default function Annotator() {
  const urlParams = new URLSearchParams(window.location.search);

  const imageUrl = urlParams.get("image") || "";
  const originalFileName = urlParams.get("originalFileName") || "";
  const rowId = urlParams.get("row") || "";
  const tableName = urlParams.get("table") || "";
  const jobId = urlParams.get("job") || "";

  const [image, status] = useImage(imageUrl, "anonymous");
  const [arrows, setArrows] = useState([]);
  const [newArrow, setNewArrow] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedArrowIndex, setSelectedArrowIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [fitToScreen, setFitToScreen] = useState(true);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";
    document.body.style.width = "100%";
  }, []);

  useEffect(() => {
    if (image && fitToScreen) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight - 200;
      const maxWidth = screenWidth - 20;
      const maxHeight = screenHeight - 20;
      const scaleX = maxWidth / image.width;
      const scaleY = maxHeight / image.height;
      setScale(Math.min(scaleX, scaleY, 1));
    } else if (image && !fitToScreen) {
      setScale(1);
    }
  }, [image, fitToScreen]);

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

  const handleArrowClick = (index) => setSelectedArrowIndex(index);

  const handleSave = async () => {
    if (!originalFileName || !stageRef.current || isSaving) return;
    setIsSaving(true);

    const dataUrl = stageRef.current.toDataURL({ mimeType: "image/jpeg", quality: 0.92 });
    const base64 = dataUrl.split(",")[1];

    try {
      await fetch(
        `https://script.google.com/macros/s/AKfycbz4Vi2yI3bnY1g5hw_K1WKiaqnPRK22XBcFF4G2Inju-9XoWfk_yXDfI2570zzA5pkM/exec?row=${encodeURIComponent(rowId)}&table=${encodeURIComponent(tableName)}&job=${encodeURIComponent(jobId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ originalFileName, base64Image: base64, rowId, table: tableName }),
          mode: "no-cors",
        }
      );
      alert("✅ Upload attempted. Check Google Drive to confirm.");
    } catch (err) {
      console.error("Upload failed", err);
      alert("🚨 Upload error: " + err.message);
    }
  };

  const handleDownload = () => {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL({ mimeType: "image/jpeg", quality: 0.92 });
    const link = document.createElement("a");
    link.download = "annotated.jpg";
    link.href = dataUrl;
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
    <div style={{ padding: 20, touchAction: "manipulation" }}>
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button style={{ fontSize: 18, padding: "10px 16px" }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saved" : "Save to App"}
        </button>
        <button style={{ fontSize: 18, padding: "10px 16px" }} onClick={handleUndo} disabled={arrows.length === 0}>Undo</button>
        <button style={{ fontSize: 18, padding: "10px 16px" }} onClick={handleDelete} disabled={selectedArrowIndex === null}>Delete</button>
        <button style={{ fontSize: 18, padding: "10px 16px" }} onClick={handleClear} disabled={arrows.length === 0}>Clear All</button>
        <button style={{ fontSize: 18, padding: "10px 16px" }} onClick={handleDownload}>Download</button>
        <button style={{ fontSize: 18, padding: "10px 16px" }} onClick={() => setFitToScreen((prev) => !prev)}>
          {fitToScreen ? "Enable Zoom" : "Fit to Screen"}
        </button>
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
          style={{ border: "1px solid #ccc", display: "block", margin: "0 auto" }}
        >
          <Layer>
            <KonvaImage image={image} width={image.width} height={image.height} />
            {arrows.map((arrow, i) => (
              <React.Fragment key={i}>
                <Arrow
                  points={arrow}
                  pointerLength={15}
                  pointerWidth={15}
                  fill="white"
                  stroke="white"
                  strokeWidth={15}
                />
                <Arrow
                  points={arrow}
                  pointerLength={13}
                  pointerWidth={13}
                  fill={i === selectedArrowIndex ? "blue" : "red"}
                  stroke={i === selectedArrowIndex ? "blue" : "red"}
                  strokeWidth={11}
                  onClick={() => handleArrowClick(i)}
                  onTap={() => handleArrowClick(i)}
                />
              </React.Fragment>
            ))}
            {newArrow.length === 4 && (
              <>
                <Arrow
                  points={newArrow}
                  pointerLength={15}
                  pointerWidth={15}
                  fill="white"
                  stroke="white"
                  strokeWidth={15}
                />
                <Arrow
                  points={newArrow}
                  pointerLength={13}
                  pointerWidth={13}
                  fill="red"
                  stroke="red"
                  strokeWidth={11}
                />
              </>
            )}
          </Layer>
        </Stage>
      ) : (
        <p>No image loaded.</p>
      )}
    </div>
  );
}
