import React, { useState, useEffect, useRef } from 'react';
import Loader from '../components/common/Loader';
import { useApp } from '../contexts/AppContext';
import { CAMPUS_MAP_DATA, LEGEND_CATEGORIES } from '../config/mapData';

const CampusMap = () => {
  const { token, t } = useApp();
  
  // Selection and details state
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [blockDetails, setBlockDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map Controls State (Zoom and Pan)
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filtering / Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null); // Filter by legend category
  const [hoveredBlock, setHoveredBlock] = useState(null); // For hover tooltip

  const svgRef = useRef(null);

  // Zoom handling helpers
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));
  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };
  const handleFit = () => {
    setScale(0.9);
    setPan({ x: 40, y: 30 });
  };

  // Dragging to Pan logic
  const handleMouseDown = (e) => {
    // Only drag on left click
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Fetch block detail data from database API or fallback to mapData description
  const handleBlockClick = (block) => {
    setSelectedBlockId(block.id);
    setLoading(true);
    setError(null);
    setBlockDetails(null);

    fetch(`/api/campus-blocks/${block.svg_id}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch details');
        return res.json();
      })
      .then((data) => {
        setBlockDetails({
          ...data,
          description: block.description,
          departments: block.departments
        });
      })
      .catch((err) => {
        console.warn('Backend API unreachable, using static fallback for', block.svg_id);
        // Fallback to static mock block structure using mapData
        setBlockDetails({
          block_name: block.name,
          block_type: block.category.toLowerCase() === 'academic' ? 'academic' : 'facility',
          description: block.description,
          departments: block.departments,
          floors: [
            { floor_label: "Location", detail_text: block.description },
            { floor_label: "Wings", detail_text: block.departments.join(", ") }
          ]
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const closeDialog = () => {
    setSelectedBlockId(null);
    setBlockDetails(null);
    setError(null);
  };

  // Check if a block matches the search query or category filter
  const isBlockHighlighted = (block) => {
    // 1. Search Query filter (matches name or departments list)
    const matchesSearch = searchQuery
      ? block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.departments.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
      : null;

    // 2. Category filter
    const matchesCategory = selectedCategory ? block.category === selectedCategory : null;

    if (matchesSearch !== null && matchesCategory !== null) {
      return matchesSearch && matchesCategory;
    } else if (matchesSearch !== null) {
      return matchesSearch;
    } else if (matchesCategory !== null) {
      return matchesCategory;
    }
    return true; // Highlighted by default if no filters
  };

  // Check if a block is pulsing (soft pulse for exact matches on search)
  const isBlockPulsing = (block) => {
    if (!searchQuery) return false;
    return block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.departments.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  // Dynamic colors for SVG polygons/rectangles matching legend system
  const getCategoryColor = (category, type = 'fill') => {
    const map = {
      'Academic': { fill: '#D8E2FF', stroke: '#1B4DA6', text: '#001A41' },
      'Hostel': { fill: '#E8EAF6', stroke: '#3F51B5', text: '#1A237E' },
      'Sports': { fill: '#E8F5E9', stroke: '#2E7D32', text: '#1B5E20' },
      'Transport': { fill: '#ECEFF1', stroke: '#607D8B', text: '#263238' },
      'Utilities': { fill: '#F5F5F5', stroke: '#757575', text: '#424242' },
      'Services': { fill: '#FFF3E0', stroke: '#E65100', text: '#5D4037' },
      'Religious': { fill: '#FFF9C4', stroke: '#FFA000', text: '#5D4037' }
    };
    return map[category]?.[type] || '#FFFFFF';
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in py-6 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-left relative">
      
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="border-b border-surfaceVariant pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-onSurfaceVariant font-bold uppercase tracking-wider">{t('campusInfo') || 'Campus Info'}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary mt-0.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] select-none">map</span>
            {t('campusMap') || 'Interactive Campus Map'}
          </h1>
          <p className="text-xs sm:text-sm text-onSurfaceVariant mt-1.5 leading-relaxed max-w-2xl">
            Interactive floor blueprints and department finder for Saranathan College of Engineering. Click on any building to view services, labs, and directions.
          </p>
        </div>

        {/* Live Search bar */}
        <div className="relative w-full md:w-80 flex-shrink-0">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-onSurfaceVariant text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search blocks or departments (e.g. CSE, RV, Library)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 border border-outline/30 rounded-full text-xs bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none text-onSurface shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-onSurfaceVariant hover:text-onSurface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* ── INTERACTIVE LEGEND ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        <span className="text-xs font-bold text-onSurfaceVariant mr-2">Filter Category:</span>
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all outline-none ${
            selectedCategory === null
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface border border-surfaceVariant/60 text-onSurfaceVariant hover:bg-surfaceContainer'
          }`}
        >
          All Locations
        </button>
        {LEGEND_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? null : cat.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all outline-none ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-surfaceVariant/60 text-onSurfaceVariant hover:bg-surfaceContainer'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]" style={{ color: isSelected ? '#FFFFFF' : cat.color }}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── MAP CONTAINER ─────────────────────────────────────────── */}
      <div className="relative bg-slate-100 border border-outline/15 rounded-[28px] overflow-hidden shadow-elevation1 select-none flex flex-col justify-between" style={{ minHeight: '680px' }}>
        
        {/* Tooltip Overlay */}
        {hoveredBlock && (
          <div 
            className="absolute top-4 left-4 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl text-xs z-20 shadow-lg pointer-events-none animate-fade-in border border-white/10"
            style={{ maxWidth: '280px' }}
          >
            <p className="font-extrabold text-[13px]">{hoveredBlock.name}</p>
            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-primaryContainer/90 bg-primaryContainer/20 px-1.5 py-0.5 rounded-full mt-1">
              {hoveredBlock.category}
            </span>
            {hoveredBlock.departments.length > 0 && (
              <p className="text-[10px] text-slate-300 mt-2 font-medium">
                <strong>Wings:</strong> {hoveredBlock.departments.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* MAP CANVAS VIEWPORT */}
        <div 
          className="flex-1 w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 800 1000"
            className="w-full h-full select-none origin-top-left transition-transform duration-75"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              shapeRendering: 'geometricPrecision' 
            }}
          >
            {/* Background canvas */}
            <rect width="800" height="1000" fill="#F4F6F9" />

            {/* GRID LINES BACKDROP */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="800" height="1000" fill="url(#grid)" opacity="0.4" />

            {/* ── ROADS & STREETS ────────────────────────────────────── */}
            {/* Top Horizontal Road */}
            <rect x="0" y="185" width="800" height="30" fill="#E2E8F0" rx="2" />
            <line x1="0" y1="200" x2="800" y2="200" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 6" />

            {/* Bottom Horizontal Road */}
            <rect x="0" y="680" width="800" height="30" fill="#E2E8F0" rx="2" />
            <line x1="0" y1="695" x2="800" y2="695" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 6" />

            {/* Center Vertical Road */}
            <rect x="390" y="215" width="30" height="465" fill="#E2E8F0" />
            <line x1="405" y1="215" x2="405" y2="680" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 6" />

            {/* Main Entrance Vertical continuation */}
            <rect x="390" y="710" width="30" height="260" fill="#E2E8F0" />
            <line x1="405" y1="710" x2="405" y2="970" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 6" />

            {/* Main Entrance Gate Banner */}
            <rect x="365" y="970" width="80" height="25" rx="4" fill="#0F172A" />
            <text x="405" y="986" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" letterSpacing="1" fontFamily="sans-serif">MAIN ENTRANCE</text>

            {/* Gutter separator dash pathway for center column */}
            <line x1="590" y1="215" x2="590" y2="680" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />

            {/* ── DYNAMIC MAP NODES ──────────────────────────────────── */}
            {CAMPUS_MAP_DATA.map((block) => {
              const highlighted = isBlockHighlighted(block);
              const pulsing = isBlockPulsing(block);
              const fillVal = getCategoryColor(block.category, 'fill');
              const strokeVal = getCategoryColor(block.category, 'stroke');
              const textVal = getCategoryColor(block.category, 'text');

              return (
                <g 
                  key={block.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBlockClick(block);
                  }}
                  onMouseEnter={() => setHoveredBlock(block)}
                  onMouseLeave={() => setHoveredBlock(null)}
                  className="group cursor-pointer"
                  style={{
                    opacity: highlighted ? 1 : 0.22,
                    transition: 'opacity 200ms ease, transform 180ms ease'
                  }}
                >
                  {/* Outer Pulsing Aura (for search focus) */}
                  {pulsing && (
                    block.shape === 'rect' ? (
                      <rect
                        x={block.coords.x - 4}
                        y={block.coords.y - 4}
                        width={block.coords.w + 8}
                        height={block.coords.h + 8}
                        rx={16}
                        fill="none"
                        stroke="#1B4DA6"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    ) : (
                      <ellipse
                        cx={block.coords.cx}
                        cy={block.coords.cy}
                        rx={block.coords.rx + 6}
                        ry={block.coords.ry + 6}
                        fill="none"
                        stroke="#1B4DA6"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )
                  )}

                  {/* Building Shape rendering */}
                  {block.shape === 'rect' ? (
                    <rect
                      x={block.coords.x}
                      y={block.coords.y}
                      width={block.coords.w}
                      height={block.coords.h}
                      rx={12}
                      fill={fillVal}
                      stroke={strokeVal}
                      strokeWidth="2"
                      className="transition-all duration-200 group-hover:brightness-95 group-hover:scale-[1.02] transform origin-center shadow-sm"
                      style={{ transformOrigin: `${block.coords.x + block.coords.w / 2}px ${block.coords.y + block.coords.h / 2}px` }}
                    />
                  ) : (
                    <ellipse
                      cx={block.coords.cx}
                      cy={block.coords.cy}
                      rx={block.coords.rx}
                      ry={block.coords.ry}
                      fill={fillVal}
                      stroke={strokeVal}
                      strokeWidth="2"
                      className="transition-all duration-200 group-hover:brightness-95 group-hover:scale-[1.02] transform origin-center shadow-sm"
                      style={{ transformOrigin: `${block.coords.cx}px ${block.coords.cy}px` }}
                    />
                  )}

                  {/* Building Name Label */}
                  {block.shape === 'rect' ? (
                    <foreignObject
                      x={block.coords.x}
                      y={block.coords.y}
                      width={block.coords.w}
                      height={block.coords.h}
                      className="pointer-events-none"
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-0.5 leading-tight overflow-hidden">
                        <span 
                          style={{ color: textVal, fontSize: block.coords.w < 60 ? '8px' : '10px' }} 
                          className="font-[900] font-['Plus_Jakarta_Sans'] whitespace-normal break-words"
                        >
                          {block.name}
                        </span>
                        {block.coords.h > 40 && (
                          <span 
                            style={{ color: strokeVal }} 
                            className="font-[700] text-[6px] uppercase tracking-wider opacity-75 mt-0.5 whitespace-normal break-words"
                          >
                            {block.category}
                          </span>
                        )}
                      </div>
                    </foreignObject>
                  ) : (
                    <foreignObject
                      x={block.coords.cx - block.coords.rx}
                      y={block.coords.cy - block.coords.ry}
                      width={block.coords.rx * 2}
                      height={block.coords.ry * 2}
                      className="pointer-events-none"
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 leading-tight overflow-hidden">
                        <span 
                          style={{ color: textVal, fontSize: '10px' }} 
                          className="font-[900] font-['Plus_Jakarta_Sans'] whitespace-normal break-words"
                        >
                          {block.name}
                        </span>
                        <span 
                          style={{ color: strokeVal }} 
                          className="font-[700] text-[7px] uppercase tracking-wider opacity-75 mt-0.5 whitespace-normal break-words"
                        >
                          {block.category}
                        </span>
                      </div>
                    </foreignObject>
                  )}

                  {/* Material Ripple Click Accent Ring */}
                  {block.shape === 'rect' ? (
                    <circle cx={block.coords.x + 12} cy={block.coords.y + 12} r="3.5" fill={strokeVal} />
                  ) : (
                    <circle cx={block.coords.cx - 15} cy={block.coords.cy - 10} r="3.5" fill={strokeVal} />
                  )}
                </g>
              );
            })}

          </svg>
        </div>

        {/* MAP CONTROLS FLOATING PANEL */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-outline/15 px-3 py-2 rounded-2xl flex items-center gap-2 shadow-lg z-10">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 outline-none transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 outline-none transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">remove</span>
          </button>
          <div className="h-4 w-px bg-slate-300"></div>
          <button
            type="button"
            onClick={handleReset}
            title="Reset Zoom"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 outline-none transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          </button>
          <button
            type="button"
            onClick={handleFit}
            title="Fit to Screen"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 outline-none transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">fit_screen</span>
          </button>
        </div>

        {/* Drag pan indicator alert banner */}
        <div className="absolute bottom-4 left-4 bg-slate-800/40 text-white/90 text-[10px] font-bold px-3 py-1.5 rounded-full z-10 pointer-events-none select-none">
          💡 Drag canvas to pan • Use +/- controls
        </div>

      </div>

      {/* ── DETAIL DIALOG / MODAL (M3 style) ─────────────────────── */}
      {selectedBlockId && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={closeDialog}
        >
          <div
            className="bg-white border border-outline/10 rounded-[28px] max-w-md w-full shadow-elevation3 animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="px-6 pt-6 pb-4 border-b border-surfaceVariant/60 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] select-none text-primary">location_on</span>
                  {blockDetails?.block_name || 'Loading...'}
                </h2>
                <span className="inline-block text-[9px] bg-primaryContainer/30 text-primary font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1">
                  {blockDetails?.block_type || 'facility'}
                </span>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="material-symbols-outlined text-[20px] select-none">close</span>
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="space-y-4 animate-pulse py-2 text-left">
                  <div className="h-3.5 bg-slate-200 rounded-full w-28 mb-3"></div>
                  <div className="space-y-3">
                    <div className="flex gap-4 items-center border-b border-slate-100 pb-2">
                      <div className="h-3.5 bg-slate-200 rounded-full w-16 flex-shrink-0"></div>
                      <div className="h-3.5 bg-slate-100 rounded-full flex-1"></div>
                    </div>
                    <div className="flex gap-4 items-center border-b border-slate-100 pb-2">
                      <div className="h-3.5 bg-slate-200 rounded-full w-16 flex-shrink-0"></div>
                      <div className="h-3.5 bg-slate-100 rounded-full flex-1"></div>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="py-4 text-center text-red-500 space-y-2">
                  <span className="material-symbols-outlined text-[36px] select-none">error</span>
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              ) : blockDetails ? (
                <div className="space-y-4 text-xs text-onSurfaceVariant">
                  
                  {/* Block Description */}
                  <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
                    <p className="font-semibold text-slate-700 leading-relaxed">
                      {blockDetails.description || 'Description not configured.'}
                    </p>
                  </div>

                  {/* Departments / Wings List */}
                  {blockDetails.departments && blockDetails.departments.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Departments & Associated Wings</p>
                      <div className="flex flex-wrap gap-1">
                        {blockDetails.departments.map((dept, i) => (
                          <span key={i} className="bg-primary/5 text-primary text-[10px] font-bold px-2.5 py-1 rounded-lg border border-primary/10">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Floor / Facility breakdowns */}
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                      Floor details & schedules
                    </p>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {blockDetails.floors && blockDetails.floors.length > 0 ? (
                        blockDetails.floors.map((floor, idx) => (
                          <div key={idx} className="flex gap-4 items-start py-1 border-b border-slate-50 last:border-0 pb-1.5 last:pb-0">
                            <span className="font-extrabold text-primary min-w-[80px] flex-shrink-0 text-left">
                              {floor.floor_label}
                            </span>
                            <span className="text-slate-600 text-left leading-normal">
                              {floor.detail_text}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-center py-2">No schedules config loaded.</p>
                      )}
                    </div>
                  </div>

                </div>
              ) : null}
            </div>

            {/* Dialog Footer with Navigate action */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {/* Navigate Action Button placeholder */}
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 cursor-not-allowed bg-slate-200/50 py-1.5 px-3 rounded-lg"
              >
                <span className="material-symbols-outlined text-[14px]">navigation</span>
                Navigate (Coming Soon)
              </button>

              <button
                type="button"
                onClick={closeDialog}
                className="px-5 py-2 bg-primary hover:bg-primaryHover text-white font-bold text-xs rounded-full shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusMap;

