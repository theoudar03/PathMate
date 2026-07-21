import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { CAMPUS_MAP_DATA } from '../config/mapData';
import SatelliteMapView from '../components/map/SatelliteMapView';
import LiveNavigationDrawer from '../components/map/LiveNavigationDrawer';

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

  // High-Contrast Vivid Colors (Fix washed-out text/color bug)
  const getBlockStyle = (category) => {
    switch (category) {
      case 'Sports':
        return { fill: '#F0FDF4', stroke: '#166534', text: '#14532D', dot: '#166534' };
      case 'Academic':
        return { fill: '#EEF2FF', stroke: '#1E40AF', text: '#1E3A8A', dot: '#1E40AF' };
      case 'Services':
      case 'Religious':
        return { fill: '#FFF7ED', stroke: '#C2410C', text: '#7C2D12', dot: '#C2410C' };
      case 'Hostel':
        return { fill: '#EEF2FF', stroke: '#3730A3', text: '#1E1B4B', dot: '#3730A3' };
      case 'Transport':
      case 'Utilities':
      default:
        return { fill: '#F8FAFC', stroke: '#334155', text: '#0F172A', dot: '#334155' };
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
        <div className="inline-flex border border-outline/30 rounded-full p-1 bg-white shadow-xs">
          <button
            onClick={() => setViewMode('satellite')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black transition-all ${
              viewMode === 'satellite' ? 'bg-primary text-white shadow-md' : 'text-onSurfaceVariant hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
            <span>🛰️ Live Satellite View</span>
          </button>

          <button
            onClick={() => setViewMode('layout')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black transition-all ${
              viewMode === 'layout' ? 'bg-primary text-white shadow-md' : 'text-onSurfaceVariant hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">map</span>
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
            <div className="relative w-full h-[680px] bg-[#F1F5F9] border border-slate-300 rounded-3xl overflow-hidden shadow-elevation2">
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
                    className="w-full h-full max-h-[640px] object-contain drop-shadow-sm select-none"
                  >
                    <g className="roads" opacity="0.8">
                      <rect x="0" y="175" width="900" height="26" fill="#CBD5E1" />
                      <line x1="0" y1="188" x2="900" y2="188" stroke="#94A3B8" strokeWidth="2" strokeDasharray="8 6" />
                      <rect x="435" y="175" width="30" height="795" fill="#CBD5E1" />
                      <line x1="450" y1="175" x2="450" y2="970" stroke="#94A3B8" strokeWidth="2" strokeDasharray="8 6" />
                      <rect x="0" y="660" width="900" height="26" fill="#CBD5E1" />
                      <line x1="0" y1="673" x2="900" y2="673" stroke="#94A3B8" strokeWidth="2" strokeDasharray="8 6" />
                    </g>

                    <g transform="translate(405, 940)" className="cursor-pointer">
                      <rect x="0" y="0" width="90" height="28" rx="8" fill="#0F172A" />
                      <text x="45" y="14" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" dominantBaseline="central">
                        MAIN ENTRANCE
                      </text>
                    </g>

                    {CAMPUS_MAP_DATA.map(block => {
                      const isSelected = selectedBlockId === block.id || navigationDestination?.id === block.id;
                      const style = getBlockStyle(block.category);

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
                            <ellipse
                              cx={cx}
                              cy={cy}
                              rx={rx}
                              ry={ry}
                              fill={style.fill}
                              stroke={isSelected ? '#1E40AF' : style.stroke}
                              strokeWidth={isSelected ? 4 : 2}
                              className="transition-all duration-150 group-hover:filter group-hover:brightness-95"
                            />
                            <circle cx={cx - rx + 30} cy={cy - ry + 20} r={4} fill={style.dot} />
                            <text
                              x={cx}
                              y={cy - 5}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={style.text}
                              fontSize="11"
                              fontWeight="900"
                              className="pointer-events-none"
                            >
                              {block.name}
                            </text>
                            <text
                              x={cx}
                              y={cy + 10}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#475569"
                              fontSize="8"
                              fontWeight="800"
                              className="pointer-events-none uppercase tracking-wider"
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
                            <rect
                              x={x}
                              y={y}
                              width={w}
                              height={h}
                              rx={14}
                              fill={style.fill}
                              stroke={isSelected ? '#1E40AF' : style.stroke}
                              strokeWidth={isSelected ? 4 : 2}
                              className="transition-all duration-150 group-hover:filter group-hover:brightness-95"
                            />
                            <circle cx={x + 14} cy={y + 14} r={3.5} fill={style.dot} />
                            <text
                              x={centerX}
                              y={h < 40 ? centerY : centerY - 6}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={style.text}
                              fontSize={w < 100 || h < 40 ? "9.5" : "11.5"}
                              fontWeight="900"
                              className="pointer-events-none"
                            >
                              {block.name}
                            </text>
                            {h >= 40 && (
                              <text
                                x={centerX}
                                y={centerY + 8}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#475569"
                                fontSize="8"
                                fontWeight="800"
                                className="pointer-events-none uppercase tracking-wider"
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
