import React, { useState, useEffect, useRef } from 'react';
import { CAMPUS_MAP_DATA } from '../../config/mapData';
import { MapPin, Navigation, Layers, Eye, Building, Clock, Users, Award, X, Lightbulb, Play, Square, Navigation2, PartyPopper, CheckCircle2 } from 'lucide-react';

const ORIGIN_PRESETS_MAP = {
  'main-gate': { name: 'Main Entrance Gate', lat: 10.7542, lng: 78.6538 },
  'boys-hostel': { name: 'Boys Hostel', lat: 10.7588, lng: 78.6522 },
  'girls-hostel': { name: 'Girls Hostel', lat: 10.7580, lng: 78.6530 },
  'central-library': { name: 'Central Library', lat: 10.7572, lng: 78.6520 },
  'canteen': { name: 'Main Canteen', lat: 10.7566, lng: 78.6513 }
};

const SatelliteMapView = ({ 
  onSelectBuildingForNavigation, 
  searchQuery = '', 
  userLocation, 
  activeDestination,
  originId = 'main-gate',
  isNavigating = false,
  onToggleNavigation
}) => {
  const [mapType, setMapType] = useState('hybrid'); // Default 'hybrid' (Satellite + Building Labels)
  const [selectedBuilding, setSelectedBuilding] = useState(activeDestination || CAMPUS_MAP_DATA[0]);
  const [leafletReady, setLeafletReady] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const lastFitBoundsKey = useRef('');

  // Sync activeDestination from props if passed
  useEffect(() => {
    if (activeDestination) {
      setSelectedBuilding(activeDestination);
      setHasArrived(false);
    }
  }, [activeDestination]);

  // Dynamically load Leaflet CDN if not already loaded
  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }

    const existingCss = document.getElementById('leaflet-css');
    if (!existingCss) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById('leaflet-js');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletReady(true);
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => setLeafletReady(true));
    }
  }, []);

  // Helper to get exact Google Maps tile URL for chosen map mode
  const getGoogleTileUrl = (type) => {
    if (type === 'satellite') {
      return 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
    } else if (type === 'roadmap') {
      return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    }
    return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  };

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const map = L.map(mapContainerRef.current, {
      center: [10.7565, 78.6520],
      zoom: 17,
      maxZoom: 20,
      minZoom: 14,
      zoomControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true
    });

    const tileLayer = L.tileLayer(getGoogleTileUrl(mapType), {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Google Maps Satellite | Saranathan College of Engineering'
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    L.control.zoom({ position: 'topright' }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletReady]);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current || !window.L) return;
    tileLayerRef.current.setUrl(getGoogleTileUrl(mapType));
  }, [mapType]);

  // Camera Focus & Arrival Distance Calculation (NO CUSTOM PIN OVERLAYS ON MAP)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // 1. Determine Source Address Coordinates
    let sourceLat = 10.7542;
    let sourceLng = 78.6538;

    if (originId === 'gps' && userLocation && userLocation.lat && userLocation.lng) {
      sourceLat = userLocation.lat;
      sourceLng = userLocation.lng;
    } else if (ORIGIN_PRESETS_MAP[originId]) {
      sourceLat = ORIGIN_PRESETS_MAP[originId].lat;
      sourceLng = ORIGIN_PRESETS_MAP[originId].lng;
    }

    const startCoords = [sourceLat, sourceLng];

    // 2. Determine Destination Building
    const targetBuilding = activeDestination || (searchQuery ? CAMPUS_MAP_DATA.find(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.departments.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : null) || selectedBuilding || CAMPUS_MAP_DATA[0];

    if (targetBuilding && targetBuilding.gps) {
      const destCoords = [targetBuilding.gps.lat, targetBuilding.gps.lng];

      // Check arrival distance (<= 15 meters)
      const R = 6371e3;
      const φ1 = sourceLat * Math.PI/180;
      const φ2 = targetBuilding.gps.lat * Math.PI/180;
      const Δφ = (targetBuilding.gps.lat - sourceLat) * Math.PI/180;
      const Δλ = (targetBuilding.gps.lng - sourceLng) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceMeters = Math.round(R * c);

      if (isNavigating && distanceMeters <= 20) {
        setHasArrived(true);
      } else {
        setHasArrived(false);
      }

      // Camera view focus on destination building
      const currentFitKey = `${startCoords[0]}_${startCoords[1]}_${destCoords[0]}_${destCoords[1]}_${targetBuilding.id}_${isNavigating}`;
      if (lastFitBoundsKey.current !== currentFitKey) {
        lastFitBoundsKey.current = currentFitKey;
        const bounds = L.latLngBounds([startCoords, destCoords]);
        map.fitBounds(bounds, { padding: [70, 70], maxZoom: 18 });
      }
    }
  }, [leafletReady, selectedBuilding, activeDestination, searchQuery, userLocation, originId, isNavigating]);

  return (
    <div className="relative w-full h-[480px] sm:h-[650px] rounded-3xl overflow-hidden shadow-elevation2 border border-outline/30 bg-slate-100 select-none text-left font-sans animate-fade-in touch-pan-y">
      {/* Light MD3 Floating Header Control Bar */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-16 z-[500] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl sm:rounded-full border border-outline/25 shadow-md text-onSurface">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
            <MapPin size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black text-onSurface leading-tight truncate">Saranathan Google Satellite Navigation</h3>
            <p className="text-[10px] text-onSurfaceVariant font-semibold hidden sm:block">
              {isNavigating ? '🚀 Live Navigation Active — High-Res Aerial Map View' : 'Select destination & tap Start Navigation'}
            </p>
          </div>
        </div>

        {/* Map Type Switcher Controls */}
        <div className="flex items-center gap-1 bg-surfaceContainerLow p-1 rounded-full border border-outline/20 text-xs w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setMapType('hybrid')}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              mapType === 'hybrid' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <Eye size={12} />
            <span>Hybrid (Recommended)</span>
          </button>

          <button
            onClick={() => setMapType('satellite')}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              mapType === 'satellite' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <Layers size={12} />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => setMapType('roadmap')}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              mapType === 'roadmap' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <Building size={12} />
            <span>Roadmap</span>
          </button>
        </div>
      </div>

      {/* Destination Arrival Celebration Message Pill */}
      {hasArrived && (
        <div className="absolute top-20 left-4 right-4 z-[550] bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-white animate-bounce flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PartyPopper size={22} className="text-yellow-300 animate-spin" />
            <div>
              <h4 className="text-xs font-black">🎉 You Have Arrived!</h4>
              <p className="text-[11px] font-bold text-emerald-100 mt-0.5">Welcome to {selectedBuilding?.name || 'Destination'}! Have a great day!</p>
            </div>
          </div>
          <button onClick={() => setHasArrived(false)} className="p-1 hover:bg-emerald-700 rounded-full">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Small Clean Helpful Banner Pill */}
      <div className="absolute bottom-4 left-4 z-[490] max-w-[85vw] sm:max-w-md bg-amber-50/95 backdrop-blur-md text-amber-900 text-[10.5px] font-bold px-3.5 py-1.5 rounded-full border border-amber-300 shadow-md flex items-center gap-1.5">
        <Lightbulb size={13} className="text-amber-600 flex-shrink-0" />
        <span className="truncate">💡 Hybrid view is highly recommended to view building labels over satellite imagery.</span>
      </div>

      {/* Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 touch-pan-y" />

      {/* Floating Light MD3 Building Information Card */}
      {selectedBuilding && (
        <div className="absolute top-28 right-3 sm:right-4 bottom-16 sm:bottom-4 w-[92vw] sm:w-96 bg-white border border-outline/30 rounded-3xl p-4 sm:p-5 text-onSurface z-[600] flex flex-col justify-between shadow-elevation3 animate-fade-in overflow-y-auto">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-start border-b border-outline/20 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primaryContainer/60 px-2.5 py-0.5 rounded-full border border-primaryContainer">
                  {selectedBuilding.category}
                </span>
                <h2 className="text-base font-black text-onSurface mt-1.5 leading-tight">{selectedBuilding.name}</h2>
              </div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="w-full h-32 sm:h-36 rounded-2xl overflow-hidden bg-slate-100 border border-outline/20 shadow-xs relative">
              <img
                src={selectedBuilding.image || '/assets/campus-bg.jpg'}
                alt={selectedBuilding.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/campus-bg.jpg';
                }}
              />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Selected Destination Building
              </div>
            </div>

            <p className="text-xs text-onSurfaceVariant leading-relaxed">
              {selectedBuilding.description}
            </p>

            {selectedBuilding.departments && selectedBuilding.departments.length > 0 && (
              <div>
                <strong className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Building size={14} className="text-primary" /> Departments & Wings
                </strong>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBuilding.departments.map(d => (
                    <span key={d} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-semibold border border-outline/20">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-outline/20">
              <div className="flex items-center gap-2 text-onSurfaceVariant">
                <Clock size={14} className="text-primary flex-shrink-0" />
                <span><strong className="text-onSurface">Hours:</strong> {selectedBuilding.office_timing || '8:30 AM - 5:00 PM'}</span>
              </div>
              {selectedBuilding.faculty && (
                <div className="flex items-center gap-2 text-onSurfaceVariant">
                  <Users size={14} className="text-green-600 flex-shrink-0" />
                  <span><strong className="text-onSurface">Head:</strong> {selectedBuilding.faculty.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-outline/20 mt-3 space-y-2">
            {!isNavigating ? (
              <button
                onClick={() => {
                  if (onToggleNavigation) onToggleNavigation(true);
                  if (onSelectBuildingForNavigation) onSelectBuildingForNavigation(selectedBuilding);
                }}
                className="w-full bg-gradient-to-r from-primary to-[#2563EB] hover:from-primaryHover hover:to-primary text-white py-3.5 rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-primary/20"
              >
                <Navigation2 size={16} className="fill-white" />
                <span>Start Live Navigation</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onToggleNavigation) onToggleNavigation(false);
                }}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-3.5 rounded-2xl font-black text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <X size={16} className="text-rose-600" />
                <span>Stop Live Navigation</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteMapView;
