import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Maximize2, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageViewerModal = ({ isOpen, onClose, images = [], initialIndex = 0, noticeTitle = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImg = images[currentIndex] || {};
  const imageUrl = currentImg.storage_url || currentImg.url || currentImg;
  const fileName = currentImg.original_name || currentImg.file_name || `image_${currentIndex + 1}.png`;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.3, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    handleResetZoom();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    handleResetZoom();
  };

  // Mouse Drag / Pan Logic when zoomed
  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Download Image File preserving filename
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950/90 backdrop-blur-lg select-none text-white font-sans animate-fade-in">
      {/* Top Toolbar Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10 z-20">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="w-8 h-8 rounded-full bg-primary/30 text-primary flex items-center justify-center font-bold text-xs">
            {currentIndex + 1}/{images.length}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{fileName}</h3>
            {noticeTitle && <p className="text-xs text-gray-400 truncate">{noticeTitle}</p>}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>

          <span className="text-xs font-mono font-semibold px-2 text-gray-400">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>

          <button
            onClick={handleResetZoom}
            className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Fit to screen"
          >
            <Maximize2 size={18} />
          </button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primaryHover transition-all shadow-sm"
            title="Download full resolution image"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition-colors ml-2"
            title="Close viewer (ESC)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden p-4 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Previous Image Button */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all hover:scale-110 shadow-lg border border-white/10"
            title="Previous image (Left Arrow)"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Displayed Image */}
        <div
          className="transition-transform duration-100 ease-out max-w-full max-h-full flex items-center justify-center"
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`
          }}
        >
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-[90vw] max-h-[78vh] object-contain rounded-lg shadow-2xl pointer-events-none"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/800x600?text=Image+Unavailable';
            }}
          />
        </div>

        {/* Next Image Button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all hover:scale-110 shadow-lg border border-white/10"
            title="Next image (Right Arrow)"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (If Multiple Images) */}
      {images.length > 1 && (
        <div className="px-6 py-3 bg-black/60 border-t border-white/10 flex items-center justify-center gap-3 overflow-x-auto z-20">
          {images.map((img, idx) => {
            const thumbUrl = img.storage_url || img.url || img;
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => { setCurrentIndex(idx); handleResetZoom(); }}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                  isSelected ? 'border-primary scale-105 shadow-md' : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body
  );
};

export default ImageViewerModal;
