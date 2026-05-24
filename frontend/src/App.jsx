import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [imagefile, setImageFile] = useState(null);
  const [imageURL, setURL] = useState(null);
  const [detections, setDetection] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    drawboxes();
    window.addEventListener('resize', drawboxes);
    return () => window.removeEventListener('resize', drawboxes);
  }, [detections, imageURL]);

  function drawboxes() {
    const canvasEl = canvasRef.current
    const imgEl = imgRef.current

    if (!canvasEl || !imgEl || !imageURL) return

    const ctx = canvasEl.getContext('2d')
    canvasEl.width = imgEl.clientWidth
    canvasEl.height = imgEl.clientHeight

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)

    // Wait until image is fully loaded to draw boxes
    if (imgEl.naturalWidth === 0) return;

    const scaleX = imgEl.clientWidth / imgEl.naturalWidth
    const scaleY = imgEl.clientHeight / imgEl.naturalHeight

    detections.forEach(det => {
      const x1 = det.x1 * scaleX
      const y1 = det.y1 * scaleY
      const width = (det.x2 - det.x1) * scaleX
      const height = (det.y2 - det.y1) * scaleY

      // Draw bounding box
      ctx.strokeStyle = '#66fcf1' // accent-cyan
      ctx.lineWidth = 3
      ctx.strokeRect(x1, y1, width, height)

      // Box fill
      ctx.fillStyle = 'rgba(102, 252, 241, 0.15)'
      ctx.fillRect(x1, y1, width, height)

      // Label background
      ctx.fillStyle = '#66fcf1'
      const text = `${det.label} ${det.confidence ? (det.confidence * 100).toFixed(0) + '%' : ''}`
      ctx.font = '600 14px Inter'
      const textWidth = ctx.measureText(text).width
      const labelY = y1 < 24 ? y1 : y1 - 24
      ctx.fillRect(x1 - 1.5, labelY, textWidth + 12, 24)

      // Label text
      ctx.fillStyle = '#0b0c10' // bg-primary
      ctx.fillText(text, x1 + 4, labelY + 16)
    })
  }

  async function Detect() {
    if (!imagefile) return;

    setIsLoading(true);
    const formdata = new FormData();
    formdata.append("file", imagefile);

    try {
      const response = await fetch("http://13.206.221.113:8000/predict", {
        method: 'POST',
        body: formdata
      });
      const data = await response.json();
      setDetection(data.result || []);
    } catch (error) {
      console.error("Error during detection:", error);
      alert("Failed to connect to the backend server.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFile(file) {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setURL(URL.createObjectURL(file));
      setDetection([]);
    } else {
      alert('Please upload a valid image file.');
    }
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    handleFile(file);
  }

  // Drag and Drop Handlers
  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title gradient-text">VIS DET</h1>
      </header>

      <main className="app-main">
        <section className="image-section glass-panel">
          {imageURL ? (
            <div className="image-container">
              <img 
                src={imageURL} 
                ref={imgRef} 
                className="uploaded-image" 
                alt="Upload preview"
                onLoad={drawboxes}
              />
              <canvas ref={canvasRef} className="detection-canvas" />
            </div>
          ) : (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <h2>No Image Selected</h2>
              <p>Upload an image to get started</p>
            </div>
          )}
        </section>

        <aside className="sidebar">
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div 
              className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <input 
                type="file" 
                className="hidden-input" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept="image/*"
              />
              <svg className="upload-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
              <p className="upload-text">
                <span>Click to upload</span> or drag and drop
              </p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button 
                className="btn-primary" 
                onClick={Detect} 
                disabled={!imagefile || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div> Processing...
                  </>
                ) : (
                  'Run Detection'
                )}
              </button>
            </div>
          </div>

          {detections.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              <div className="results-header">
                <h3>Detections</h3>
                <span className="results-badge">{detections.length} Found</span>
              </div>
              <div className="results-list">
                {detections.map((det, index) => (
                  <div key={index} className="result-item">
                    <span className="result-label">{det.label}</span>
                    {det.confidence && (
                      <span className="result-confidence">{(det.confidence * 100).toFixed(1)}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}

export default App