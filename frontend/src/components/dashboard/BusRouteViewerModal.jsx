import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize, Minimize, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

const BusRouteViewerModal = ({ route, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!route) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleMouseDown = (e) => {
    if (zoom > 1 || rotation !== 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = route.image_url;
    link.download = `SCE_Bus_Route_${route.session}_${route.route_date || 'Today'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fade-in text-left select-none overflow-hidden">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between gap-4 bg-surfaceContainerLowest/15 p-3 sm:p-4 rounded-2xl border border-white/10 text-white z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              route.session === 'morning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {route.session === 'morning' ? '🌅 Morning Arrival' : '🌙 Evening Departure'}
            </span>
            <span className="text-xs text-white/70 font-mono">
              {route.route_date ? new Date(route.route_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 truncate">{route.title}</h2>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={handleZoomIn} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <button onClick={handleZoomOut} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <button onClick={handleRotate} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" title="Rotate Image 90°">
            <RotateCw size={18} />
          </button>
          <button onClick={handleReset} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" title="Reset View">
            <RefreshCw size={18} />
          </button>
          <button onClick={handleDownload} className="p-2 rounded-xl bg-primary text-white font-bold hover:bg-primaryHover transition-colors cursor-pointer flex items-center gap-1 text-xs px-3" title="Download High-Res Image">
            <Download size={16} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <button onClick={onClose} className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer" title="Close Viewer">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Viewer Stage (Interactive Canvas) */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing my-3 rounded-3xl bg-black/40 border border-white/5"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="transition-transform duration-75 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={route.image_url}
            alt={route.title}
            className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl select-none pointer-events-none"
            loading="eager"
          />
        </div>
      </div>

      {/* Footer Info Disclaimer & Status Banner */}
      <div className="bg-surfaceContainerLowest/15 p-3 rounded-2xl border border-white/10 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs z-10">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <p className="text-[11px] leading-tight">
            <strong>Official Source of Truth:</strong> Bus routes may change daily based on transport operations. Please refer strictly to the published image board.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-white/70 font-mono flex-shrink-0">
          <span className="flex items-center gap-1">
            <Clock size={14} /> Uploaded: {new Date(route.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span>By: {route.uploaded_by || 'Administration'}</span>
        </div>
      </div>
    </div>
  );
};

export default BusRouteViewerModal;
