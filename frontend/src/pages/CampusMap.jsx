import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { CAMPUS_MAP_DATA } from '../config/mapData';
import SatelliteMapView from '../components/map/SatelliteMapView';
import LiveNavigationDrawer from '../components/map/LiveNavigationDrawer';

// Multi-line SVG Text helper to fix text overlaps & overflows on all devices
const renderMultiLineText = (name, centerX, centerY, w, h, styleText, fontSize) => {
  const words = name.split(' ');
  
  if (words.length <= 1 || (w > 120 && name.length < 12)) {
    return (
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="central"
        fill={styleText}
        fontSize={fontSize}
        fontWeight="900"
        className="pointer-events-none select-none"
      >
        {name}
      </text>
    );
  }

  let line1 = words[0];
  let line2 = words.slice(1).join(' ');
  
  if (words.length === 3) {
    if (words[0].length + words[1].length < words[2].length + 5) {
      line1 = words[0] + ' ' + words[1];
      line2 = words[2];
    } else {
      line1 = words[0];
      line2 = words[1] + ' ' + words[2];
    }
  }

  return (
    <text
      x={centerX}
      y={centerY}
      textAnchor="middle"
      dominantBaseline="central"
      fill={styleText}
      fontSize={fontSize}
      fontWeight="900"
      className="pointer-events-none select-none"
    >
      <tspan x={centerX} dy="-0.5em">{line1}</tspan>
      <tspan x={centerX} dy="1.1em">{line2}</tspan>
    </text>
  );
};

const CampusMap = () => {
  const { token } = useApp();
  
  // Selection and details state
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [blockDetails, setBlockDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // View Mode Switcher: Default 'satellite' (Satellite View FIRST) | 'layout' (2D Layout SECOND)
  const [viewMode, setViewMode] = useState('satellite');

  // Shared Navigation & GPS State across Map and Drawer
  const [showNavigationDrawer, setShowNavigationDrawer] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState(CAMPUS_MAP_DATA[0]);
  const [navigationOriginId, setNavigationOriginId] = useState('main-gate');
  const [userLocation, setUserLocation] = useState(null);

  // Map Controls State (Zoom and Pan for 2D Layout)
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Gemini AI Search State
  const [aiInput, setAiInput] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiIntentMsg, setAiIntentMsg] = useState(null);

  const svgRef = useRef(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));
  const handleReset = () => { setScale(1); setPan({ x: 0, y: 0 }); };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUpOrLeave = () => setIsDragging(false);

  const handleAiSearch = async (queryToSearch) => {
    const query = queryToSearch || aiInput;
    if (!query || !query.trim()) return;

    setIsAiSearching(true);
    setAiIntentMsg("Gemini AI analyzing navigation intent...");
    try {
      const res = await fetch('/api/ai/navigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      const qLower = query.toLowerCase();

      const targetBlock = CAMPUS_MAP_DATA.find(b => 
        b.id === data.destinationId ||
        b.svg_id === data.destinationId || 
        b.name.toLowerCase().includes((data.destination || '').toLowerCase()) ||
        b.departments.some(d => d.toLowerCase().includes((data.destination || '').toLowerCase())) ||
        (qLower.includes('cse') && b.id === 'rv-block') ||
        (qLower.includes('ece') && b.id === 'ks-block') ||
        (qLower.includes('ai') && b.id === 'bd-block') ||
        (qLower.includes('civil') && b.id === 'js-block') ||
        (qLower.includes('mech') && b.id === 'me-block')
      ) || CAMPUS_MAP_DATA[0];

      setAiIntentMsg(`Navigating to ${targetBlock.name}`);
      setNavigationDestination(targetBlock);
      setIsNavigating(true);
      setShowNavigationDrawer(true);
      setSelectedBlockId(targetBlock.id);
      
      setScale(1.2);
      setPan({ 
        x: 400 - (targetBlock.coords.x || targetBlock.coords.cx || 400), 
        y: 500 - (targetBlock.coords.y || targetBlock.coords.cy || 500) 
      });
    } catch (err) {
      console.error(err);
      setAiIntentMsg("AI Navigation failed.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleBlockClick = (block) => {
    setSelectedBlockId(block.id);
    setLoading(true);
    setBlockDetails(null);

    fetch(`/api/campus-blocks/${block.svg_id}`, {
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    })
      .then(res => res.json())
      .then(data => {
        setBlockDetails({
          ...data,
          description: block.description,
          departments: block.departments,
          labs: block.labs,
          faculty: block.faculty
        });
      })
      .catch(() => {
        setBlockDetails({
          block_name: block.name,
          block_type: 'academic',
          description: block.description,
          departments: block.departments,
          labs: block.labs,
          faculty: block.faculty
        });
      })
      .finally(() => setLoading(false));
  };

  const closeDialog = () => {
    setSelectedBlockId(null);
    setBlockDetails(null);
  };

  // Professional Architectural/Satellite Blueprints Color Theme
  const getBlockStyle = (category) => {
    switch (category) {
      case 'Sports':
        return { fill: '#E8F5E9', stroke: '#2E7D32', text: '#1B5E20', dot: '#4CAF50' };
      case 'Academic':
        return { fill: '#F0F4F8', stroke: '#334E68', text: '#102A43', dot: '#2F80ED' };
      case 'Services':
      case 'Religious':
        return { fill: '#FFF3E0', stroke: '#E65100', text: '#5D4037', dot: '#FF9800' };
      case 'Hostel':
        return { fill: '#F5F3FF', stroke: '#5B21B6', text: '#2E1065', dot: '#8B5CF6' };
      case 'Transport':
      case 'Utilities':
      default:
        return { fill: '#ECEFF1', stroke: '#37474F', text: '#263238', dot: '#607D8B' };
    }
  };

  return (
    <div className="space-y-6 font-sans text-left max-w-7xl mx-auto py-4 animate-fade-in select-none">
      {/* Light MD3 Header */}
      <div className="border-b border-surfaceVariant pb-4 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-onSurfaceVariant font-bold uppercase tracking-wider">Saranathan Campus Portal</span>
          <h1 className="text-3xl font-extrabold text-primary flex items-center gap-2 mt-0.5">
            <span className="material-symbols-outlined text-[32px]">map</span>
            Campus Map & Live Navigation
          </h1>
          <p className="text-sm text-onSurfaceVariant mt-1">
            Pick your destination building, track live GPS walking directions, and explore 18+ SCE landmarks.
          </p>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex border border-outline/30 rounded-full p-1 bg-white shadow-xs w-full sm:w-auto">
          <button
            onClick={() => setViewMode('satellite')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 sm:px-5 sm:py-2.5 text-[10.5px] sm:text-xs font-black transition-all ${
              viewMode === 'satellite' ? 'bg-primary text-white shadow-md' : 'text-onSurfaceVariant hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">satellite_alt</span>
            <span>🛰️ Satellite View</span>
          </button>

          <button
            onClick={() => setViewMode('layout')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 sm:px-5 sm:py-2.5 text-[10.5px] sm:text-xs font-black transition-all ${
              viewMode === 'layout' ? 'bg-primary text-white shadow-md' : 'text-onSurfaceVariant hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">map</span>
            <span>🗺️ 2D Layout Map</span>
          </button>
        </div>
      </div>

      {/* Light MD3 AI Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-outline/30 shadow-elevation1 space-y-2">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1 w-full bg-surfaceContainerLow border border-outline/25 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary">
            <span className="material-symbols-outlined text-primary text-[20px]">search</span>
            <input
              type="text"
              value={aiInput}
              onChange={(e) => { setAiInput(e.target.value); setSearchQuery(e.target.value); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="Ask AI to navigate anywhere on campus... (e.g. 'take me to cse department')"
              className="w-full bg-transparent border-0 text-xs text-onSurface placeholder-gray-400 focus:outline-none font-semibold py-2"
            />
          </div>

          <button
            onClick={() => handleAiSearch()}
            disabled={isAiSearching}
            className="w-full md:w-auto px-6 py-3 bg-primary hover:bg-primaryHover text-white font-black text-xs rounded-full shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>{isAiSearching ? 'Analyzing...' : 'Ask AI Navigation'}</span>
          </button>
        </div>

        {aiIntentMsg && (
          <div className="text-xs text-primary font-bold flex items-center gap-2 bg-primaryContainer/30 p-2.5 rounded-2xl border border-primaryContainer">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>{aiIntentMsg}</span>
          </div>
        )}
      </div>

      {/* Main Container: Map Stage + Navigation Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Map View Column */}
        <div className="lg:col-span-2">
          {viewMode === 'satellite' ? (
            <SatelliteMapView
              searchQuery={searchQuery}
              userLocation={userLocation}
              activeDestination={navigationDestination}
              originId={navigationOriginId}
              isNavigating={isNavigating}
              onToggleNavigation={(navState) => setIsNavigating(navState)}
              onSelectBuildingForNavigation={(b) => {
                setNavigationDestination(b);
                setIsNavigating(true);
                setShowNavigationDrawer(true);
              }}
            />
          ) : (
            /* 2D Architectural Layout Map (High Contrast & Vivid Text Colors) */
            <div className="relative w-full h-[520px] sm:h-[820px] bg-[#F4F3F0] border border-slate-300 rounded-3xl overflow-hidden shadow-elevation2">
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 bg-white p-1.5 rounded-2xl shadow-md border border-outline/20">
                <button onClick={handleZoomIn} className="p-2 hover:bg-slate-100 rounded-xl text-gray-700" title="Zoom In">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
                <button onClick={handleZoomOut} className="p-2 hover:bg-slate-100 rounded-xl text-gray-700" title="Zoom Out">
                  <span className="material-symbols-outlined text-[20px]">remove</span>
                </button>
                <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-xl text-gray-700" title="Reset View">
                  <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
                </button>
              </div>

              <div
                className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center p-2"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
              >
                <div
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                  }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <svg
                    ref={svgRef}
                    viewBox="0 0 900 980"
                    className="w-full h-full max-h-[480px] sm:max-h-[780px] object-contain drop-shadow-sm select-none"
                  >
                    <defs>
                      <filter id="building-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#0d1117" flood-opacity="0.22"/>
                      </filter>
                    </defs>

                    {/* Ground Background */}
                    <rect x="0" y="0" width="900" height="980" fill="#F4F3F0" />

                    {/* Grassy Areas & Dirt Tracks */}
                    {/* Main Cricket Ground Ring Track */}
                    <ellipse cx="240" cy="100" rx="205" ry="70" fill="none" stroke="#E0DDD5" strokeWidth="6" opacity="0.5" />
                    {/* Cricket Ground 2 turf */}
                    <rect x="30" y="355" width="310" height="285" rx="20" fill="#E2F0D9" stroke="#C3D9B5" strokeWidth="1" />
                    <rect x="50" y="375" width="270" height="245" rx="10" fill="none" stroke="#FFFFFF" strokeDasharray="6 4" strokeWidth="1" opacity="0.5" />
                    {/* Cricket Ground 1 turf */}
                    <rect x="30" y="705" width="310" height="220" rx="20" fill="#E2F0D9" stroke="#C3D9B5" strokeWidth="1" />
                    
                    <g className="roads" opacity="1">
                      {/* Main Roads (Google White Asphalt Style) */}
                      <rect x="0" y="175" width="900" height="26" fill="#FFFFFF" stroke="#E8EAED" strokeWidth="1.5" />
                      <line x1="0" y1="188" x2="900" y2="188" stroke="#FEEFC3" strokeWidth="1.5" strokeDasharray="6 4" />
                      
                      <rect x="435" y="175" width="30" height="795" fill="#FFFFFF" stroke="#E8EAED" strokeWidth="1.5" />
                      <line x1="450" y1="175" x2="450" y2="970" stroke="#FEEFC3" strokeWidth="1.5" strokeDasharray="6 4" />
                      
                      <rect x="0" y="660" width="900" height="26" fill="#FFFFFF" stroke="#E8EAED" strokeWidth="1.5" />
                      <line x1="0" y1="673" x2="900" y2="673" stroke="#FEEFC3" strokeWidth="1.5" strokeDasharray="6 4" />

                      {/* center vertical path from KS block to mechanical workshop */}
                      <rect x="656" y="175" width="14" height="485" fill="#FFFFFF" stroke="#E8EAED" strokeWidth="1" />
                      <line x1="663" y1="175" x2="663" y2="660" stroke="#E8EAED" strokeWidth="1" strokeDasharray="3 3" />

                      {/* horizontal path between Mechanical Lab and KS Block */}
                      <rect x="465" y="522" width="205" height="11" fill="#FFFFFF" stroke="#E8EAED" strokeWidth="1" />
                      <line x1="465" y1="527.5" x2="670" y2="527.5" stroke="#E8EAED" strokeWidth="1" strokeDasharray="3 3" />

                      {/* New Right Column Horizontal Roads */}
                      {/* 1. Between Bus Boarding Point and Staff Parking Lot */}
                      <rect x="656" y="260" width="244" height="15" fill="#FFFFFF" stroke="#E8EAED" strokeWidth="1" />
                      <line x1="656" y1="267.5" x2="900" y2="267.5" stroke="#E8EAED" strokeWidth="1" strokeDasharray="3 3" />

                      {/* 2. Between Staff Parking Lot and BD Block */}
                      <rect x="656" y="330" width="244" height="15" fill="#FFFFFF" stroke="#E8EAED" strokeWidth="1" />
                      <line x1="656" y1="337.5" x2="900" y2="337.5" stroke="#E8EAED" strokeWidth="1" strokeDasharray="3 3" />
                    </g>

                    {/* Scattered Trees (Decorative details for satellite feel) */}
                    {[
                      { cx: 480, cy: 150 }, { cx: 410, cy: 220 }, { cx: 410, cy: 300 }, { cx: 410, cy: 380 }, { cx: 410, cy: 450 },
                      { cx: 620, cy: 150 }, { cx: 615, cy: 195 }, { cx: 370, cy: 150 }, { cx: 350, cy: 320 }, { cx: 350, cy: 680 },
                      { cx: 480, cy: 720 }, { cx: 480, cy: 780 }, { cx: 480, cy: 840 }, { cx: 370, cy: 800 }
                    ].map((t, idx) => (
                      <g key={idx} className="pointer-events-none">
                        <circle cx={t.cx} cy={t.cy} r={7} fill="#1E3F20" opacity="0.15" transform="translate(1, 2)" />
                        <circle cx={t.cx} cy={t.cy} r={6} fill="#2D6A4F" />
                        <circle cx={t.cx - 1.5} cy={t.cy - 1.5} r={4} fill="#52B788" />
                      </g>
                    ))}

                    <g transform="translate(405, 940)" className="cursor-pointer">
                      <rect x="0" y="0" width="90" height="28" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                      <text x="45" y="14" fill="#FFFFFF" fontSize="8.5" fontWeight="900" textAnchor="middle" dominantBaseline="central">
                        MAIN ENTRANCE
                      </text>
                    </g>

                    {CAMPUS_MAP_DATA.map(block => {
                      const isSelected = selectedBlockId === block.id || navigationDestination?.id === block.id;
                      const style = getBlockStyle(block.category);
                      const isCourtyard = ['ks-block', 'rv-block', 'bd-block', 'js-block', 'boys-hostel'].includes(block.id);
                      const isParking = ['staff-parking', 'parking-lot'].includes(block.id);

                      // Detailed color theme per building type to look like real rooftops
                      let fillCol = style.fill;
                      let strokeCol = isSelected ? '#2563EB' : style.stroke;
                      let strokeW = isSelected ? 4 : 1.8;

                      if (block.category === 'Sports') {
                        if (block.id === 'volleyball-court') {
                          fillCol = '#EAD6BD'; // warm beach sand court
                        } else if (block.id === 'basketball-court') {
                          fillCol = '#4A7F9D'; // synthetic acrylic basketball blue
                        } else {
                          fillCol = '#81B87D'; // professional vibrant turf green
                        }
                      } else if (block.category === 'Academic') {
                        fillCol = '#FFFFFF'; // concrete roof
                      } else if (block.category === 'Hostel') {
                        fillCol = '#F8FAFC'; // hostel roof
                      } else if (isParking) {
                        fillCol = '#4F5866'; // slate charcoal asphalt
                      }

                      if (block.shape === 'ellipse') {
                        const cx = block.coords.cx;
                        const cy = block.coords.cy;
                        const rx = block.coords.rx;
                        const ry = block.coords.ry;

                        return (
                          <g
                            key={block.id}
                            onClick={() => handleBlockClick(block)}
                            className="cursor-pointer group"
                            opacity={1}
                          >
                            {/* Outer field track shadow */}
                            <ellipse
                              cx={cx}
                              cy={cy}
                              rx={rx}
                              ry={ry}
                              fill={fillCol}
                              stroke={strokeCol}
                              strokeWidth={strokeW}
                              filter="url(#building-shadow)"
                              className="transition-all duration-150 group-hover:filter group-hover:brightness-95"
                            />
                            {/* Inner white track lines */}
                            <ellipse
                              cx={cx}
                              cy={cy}
                              rx={rx - 12}
                              ry={ry - 6}
                              fill="none"
                              stroke="#FFFFFF"
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                              opacity="0.6"
                            />
                            {/* Center cricket pitch block */}
                            {block.id === 'main-cricket' && (
                              <rect x={cx - 10} y={cy - 18} width={20} height={36} fill="#D2B48C" stroke="#A0522D" strokeWidth="1" rx="1" />
                            )}
                            {renderMultiLineText(block.name, cx, cy - 6, rx * 2, ry * 2, style.text, "11.5")}
                            <text
                              x={cx}
                              y={cy + 12}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#5F6368"
                              fontSize="8.5"
                              fontWeight="800"
                              className="pointer-events-none uppercase tracking-wider select-none"
                            >
                              {block.category}
                            </text>
                          </g>
                        );
                      } else {
                        const x = block.coords.x;
                        const y = block.coords.y;
                        const w = block.coords.w;
                        const h = block.coords.h;
                        const centerX = x + w / 2;
                        const centerY = y + h / 2;

                        return (
                          <g
                            key={block.id}
                            onClick={() => handleBlockClick(block)}
                            className="cursor-pointer group"
                            opacity={1}
                          >
                            {/* 3D Foundation wall shadow */}
                            <rect
                              x={x}
                              y={y}
                              width={w}
                              height={h}
                              rx={12}
                              fill="#1E293B"
                              opacity="0.12"
                              transform="translate(3, 4)"
                              className="pointer-events-none"
                            />
                            {/* Roof Surface */}
                            <rect
                              x={x - 1}
                              y={y - 2}
                              width={w}
                              height={h}
                              rx={12}
                              fill={fillCol}
                              stroke={strokeCol}
                              strokeWidth={strokeW}
                              filter="url(#building-shadow)"
                              className="transition-all duration-150 group-hover:filter group-hover:brightness-95"
                            />

                            {/* Courtyard cutout with grass interior */}
                            {isCourtyard && (
                              <g>
                                <rect
                                  x={x - 1 + w * 0.25}
                                  y={y - 2 + h * 0.25}
                                  width={w * 0.5}
                                  height={h * 0.5}
                                  rx={6}
                                  fill="#E6DFD3"
                                  stroke={strokeCol}
                                  strokeWidth="1.2"
                                />
                                <rect
                                  x={x - 1 + w * 0.27}
                                  y={y - 2 + h * 0.27}
                                  width={w * 0.46}
                                  height={h * 0.46}
                                  rx={4}
                                  fill="#B2D2A4"
                                  opacity="0.6"
                                />
                              </g>
                            )}

                            {/* Parking Spaces markings & vehicles */}
                            {isParking && (
                              <g opacity="0.6" stroke="#FFFFFF" strokeWidth="0.8" fill="none" className="pointer-events-none">
                                <line x1={x + 5} y1={y + 8} x2={x + w - 5} y2={y + 8} strokeDasharray="3 2" />
                                <line x1={x + 5} y1={y + h - 10} x2={x + w - 5} y2={y + h - 10} strokeDasharray="3 2" />
                                {Array.from({ length: Math.floor(w / 12) }).map((_, idx) => (
                                  <line key={idx} x1={x + 6 + idx * 12} y1={y + 2} x2={x + 6 + idx * 12} y2={y + 8} />
                                ))}
                                {/* Parked cars as small colored rectangles */}
                                {Array.from({ length: Math.floor(w / 28) }).map((_, idx) => {
                                  const carColors = ['#F87171', '#60A5FA', '#F3F4F6', '#FBBF24', '#34D399'];
                                  const color = carColors[idx % carColors.length];
                                  return (
                                    <rect
                                      key={idx}
                                      x={x + 10 + idx * 28}
                                      y={y + 2}
                                      width={7}
                                      height={4}
                                      fill={color}
                                      stroke="none"
                                    />
                                  );
                                })}
                              </g>
                            )}

                            {renderMultiLineText(block.name, centerX, h < 40 ? centerY : centerY - 6, w, h, style.text, w < 100 || h < 40 ? "9.5" : "11")}
                            {h >= 40 && (
                              <text
                                x={centerX}
                                y={centerY + 10}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#5F6368"
                                fontSize="8"
                                fontWeight="800"
                                className="pointer-events-none uppercase tracking-wider select-none"
                              >
                                {block.category}
                              </text>
                            )}
                          </g>
                        );
                      }
                    })}
                  </svg>
                </div>
              </div>

              {/* MD3 Google Style Details Popup Card overlay */}
              {blockDetails && (
                <div 
                  className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-5 text-slate-800 z-30 shadow-xl animate-scale-up text-left"
                  style={{ boxShadow: '0 12px 36px rgba(0,0,0,0.15)' }}
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primaryContainer/60 px-2.5 py-0.5 rounded-full border border-primaryContainer">
                        {blockDetails.block_type || blockDetails.category || 'Location'}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1.5 leading-tight">{blockDetails.block_name || blockDetails.name}</h3>
                    </div>
                    <button 
                      onClick={closeDialog}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      aria-label="Close details"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed mb-3.5">
                    {blockDetails.description || 'Welcome to this campus building location. Utilize navigation to locate live steps from any starting gate.'}
                  </p>
                  
                  {blockDetails.departments && blockDetails.departments.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Departments</span>
                      <div className="flex flex-wrap gap-1">
                        {blockDetails.departments.map(d => (
                          <span key={d} className="px-2.5 py-0.5 bg-slate-50 border border-slate-200/40 rounded text-[9.5px] font-bold text-slate-600">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        const selectedData = CAMPUS_MAP_DATA.find(b => b.id === selectedBlockId);
                        if (selectedData) {
                          setNavigationDestination(selectedData);
                          setIsNavigating(true);
                          setShowNavigationDrawer(true);
                        }
                        closeDialog();
                      }}
                      className="flex-1 bg-primary hover:bg-primaryHover text-white py-2 px-4 rounded-full text-xs font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px] font-bold">explore</span>
                      <span>Start Navigation</span>
                    </button>
                    <button
                      onClick={closeDialog}
                      className="px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-750 rounded-full text-xs font-bold transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Navigation Drawer Column */}
        <div className="space-y-6">
          <LiveNavigationDrawer
            initialDestination={navigationDestination}
            isNavigating={isNavigating}
            onToggleNavigation={(navState) => setIsNavigating(navState)}
            onOriginChange={(origId) => setNavigationOriginId(origId)}
            onDestinationChange={(building) => setNavigationDestination(building)}
            onUserLocationUpdate={(coords) => setUserLocation(coords)}
            onClose={() => setShowNavigationDrawer(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default CampusMap;
