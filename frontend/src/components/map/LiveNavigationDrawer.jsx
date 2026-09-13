import React, { useState, useEffect } from 'react';
import { CAMPUS_MAP_DATA } from '../../config/mapData';
import { Navigation, MapPin, Compass, Clock, Footprints, CheckCircle2, AlertCircle, Navigation2, X, StopCircle, PartyPopper, Bike, Accessibility, RotateCcw, Trash2, ArrowRight, DoorOpen } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  buildGraph,
  findShortestPathAStar,
  snapToNearestNode,
  calculateRouteDistanceAndDuration,
  generateDetailedTurnSteps,
  checkIsOffRoute
} from '../../services/routingEngine';

const LiveNavigationDrawer = ({ 
  initialDestination, 
  onClose, 
  onUserLocationUpdate,
  isNavigating = false,
  locations = [],
  routingGraph = { nodes: [], edges: [], building_entrances: [], campus_obstacles: [] },
  onToggleNavigation,
  onOriginChange,
  onDestinationChange
}) => {
  const rawLocations = (locations && locations.length > 0) ? locations : CAMPUS_MAP_DATA;
  const locationList = (() => {
    const seen = new Set();
    return rawLocations.filter(b => {
      const key = String(b.name || b.building_code || b.id || '').toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const [originId, setOriginId] = useState('main-gate');
  const [destinationId, setDestinationId] = useState(initialDestination?.id || locationList[0]?.id || 'ks-block');
  const [selectedEntranceId, setSelectedEntranceId] = useState('');
  const [travelMode, setTravelMode] = useState('walking'); // 'walking', 'cycling', 'wheelchair'
  const [hasCalculatedRoute, setHasCalculatedRoute] = useState(false);
  const [isOffRouteDetected, setIsOffRouteDetected] = useState(false);
  
  const [useLiveGps, setUseLiveGps] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [currentGpsCoords, setCurrentGpsCoords] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);

  // Origin Presets
  const originPresets = [
    { id: 'main-gate', name: 'Main Entrance Security Gate', coords: { lat: 10.7543, lng: 78.6528 } },
    { id: 'boys-hostel', name: 'Boys Hostel Entrance', coords: { lat: 10.7584, lng: 78.6514 } },
    { id: 'girls-hostel', name: 'Girls Hostel Entrance', coords: { lat: 10.7580, lng: 78.6522 } },
    { id: 'central-library', name: 'BD Block Library Ground', coords: { lat: 10.7576, lng: 78.6516 } },
    { id: 'canteen', name: 'Main Canteen & Food Court', coords: { lat: 10.7572, lng: 78.6512 } }
  ];

  // Sync initial destination from parent props when selected
  useEffect(() => {
    if (initialDestination?.id) {
      setDestinationId(initialDestination.id);
      setSelectedEntranceId('');
      setHasArrived(false);
    }
  }, [initialDestination]);

  const destinationBuilding = locationList.find(b => String(b.id) === String(destinationId)) || locationList[0];
  const originPreset = originPresets.find(o => o.id === originId) || originPresets[0];

  // Filter building entrances available for selected building
  const buildingEntrances = (routingGraph.building_entrances || routingGraph.entrances || []).filter(e => 
    String(e.building_id || '').toLowerCase() === String(destinationId).toLowerCase() ||
    String(e.building_code || '').toLowerCase() === String(destinationId).toLowerCase()
  );

  // Handle Origin Dropdown Change
  const handleOriginSelect = (id) => {
    setOriginId(id);
    setHasArrived(false);
    if (onOriginChange) onOriginChange(id);
  };

  // Handle Destination Dropdown Change
  const handleDestinationSelect = (id) => {
    setDestinationId(id);
    setSelectedEntranceId('');
    setHasArrived(false);
    const building = locationList.find(b => String(b.id) === String(id));
    if (building && onDestinationChange) {
      onDestinationChange(building);
    }
  };

  // Start continuous watchPosition on mount for live movement tracking
  useEffect(() => {
    if ('geolocation' in navigator) {
      setGpsLoading(true);
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentGpsCoords(coords);
          setGpsLoading(false);
          setGpsError(null);
          if (onUserLocationUpdate) onUserLocationUpdate(coords);
        },
        (err) => {
          if (err.code === 1) {
            setGpsError('Geolocation permission blocked. Reset it via browser site settings.');
          } else {
            setGpsError('Unable to detect GPS location. Using campus origin presets.');
          }
          setGpsLoading(false);
          setUseLiveGps(false);
          handleOriginSelect('main-gate');
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setGpsError('Geolocation is not supported by your browser.');
      handleOriginSelect('main-gate');
    }
  }, [onUserLocationUpdate]);

  // Graph-backed A* Route & Navigation Details Calculation
  const calculateNavigationDetails = () => {
    const origGps = (useLiveGps && currentGpsCoords && currentGpsCoords.lat) ? currentGpsCoords : originPreset.coords;
    
    // Check if an entrance is selected
    const chosenEntrance = buildingEntrances.find(e => String(e.id) === String(selectedEntranceId));
    let destLat = destinationBuilding.gps ? destinationBuilding.gps.lat : parseFloat(destinationBuilding.latitude || 10.7565);
    let destLng = destinationBuilding.gps ? destinationBuilding.gps.lng : parseFloat(destinationBuilding.longitude || 78.6520);
    
    if (chosenEntrance && chosenEntrance.latitude && chosenEntrance.longitude) {
      destLat = parseFloat(chosenEntrance.latitude);
      destLng = parseFloat(chosenEntrance.longitude);
    }

    const destGps = { lat: destLat, lng: destLng };

    // Build Graph from prop or default
    const nodes = routingGraph.nodes && routingGraph.nodes.length > 0 ? routingGraph.nodes : [];
    const edges = routingGraph.edges && routingGraph.edges.length > 0 ? routingGraph.edges : [];
    
    let pathCoordinates = [];
    if (nodes.length > 0 && edges.length > 0) {
      const graph = buildGraph(nodes, edges);
      const startNode = snapToNearestNode(origGps, nodes);
      const endNode = snapToNearestNode(destGps, nodes);

      if (startNode && endNode) {
        const pathNodeIds = findShortestPathAStar(graph, startNode.id, endNode.id, nodes);
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        
        pathCoordinates = pathNodeIds
          .map(id => nodeMap.get(id))
          .filter(Boolean)
          .map(n => [parseFloat(n.longitude), parseFloat(n.latitude)]);

        // Ensure origin and destination exact points are snapped at start & end
        if (pathCoordinates.length > 0) {
          pathCoordinates[0] = [origGps.lng, origGps.lat];
          pathCoordinates[pathCoordinates.length - 1] = [destGps.lng, destGps.lat];
        }
      }
    }

    // Fallback if graph path could not be resolved
    if (pathCoordinates.length === 0) {
      pathCoordinates = [[origGps.lng, origGps.lat], [destGps.lng, destGps.lat]];
    }

    // Distance and ETA calculation
    const { distanceMeters, formattedDistance, durationMinutes } = calculateRouteDistanceAndDuration(pathCoordinates, travelMode);

    // Detailed Turn Steps
    const steps = generateDetailedTurnSteps(pathCoordinates, nodes);

    return { distanceMeters, formattedDistance, timeMinutes: durationMinutes, steps, pathCoordinates };
  };

  const nav = calculateNavigationDetails();

  // Check off-route status when live navigating
  useEffect(() => {
    if (isNavigating && useLiveGps && currentGpsCoords && nav.pathCoordinates.length > 1) {
      const offRoute = checkIsOffRoute(currentGpsCoords, nav.pathCoordinates, 25);
      setIsOffRouteDetected(offRoute);
    } else {
      setIsOffRouteDetected(false);
    }
  }, [isNavigating, useLiveGps, currentGpsCoords, nav.pathCoordinates]);

  // Check arrival status (<= 20 meters) when navigating
  useEffect(() => {
    if (isNavigating && nav.distanceMeters <= 20) {
      setHasArrived(true);
    }
  }, [isNavigating, nav.distanceMeters]);

  const handleGetDirections = () => {
    setHasCalculatedRoute(true);
    if (onDestinationChange) {
      onDestinationChange(destinationBuilding);
    }
  };

  const handleClearRoute = () => {
    setHasCalculatedRoute(false);
    if (onToggleNavigation) onToggleNavigation(false);
  };

  return (
    <div className="bg-white border border-outline/30 rounded-3xl p-5 sm:p-6 shadow-elevation2 space-y-5 text-left font-sans animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black shadow-xs">
            <Navigation size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">Campus Navigation</h2>
            <p className="text-xs text-slate-500 font-semibold">Real-Time Routing & Walking Directions</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Arrival Celebration Alert */}
      {hasArrived && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg border border-emerald-500 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <PartyPopper size={24} className="text-yellow-300 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black">🎉 Destination Reached!</h4>
              <p className="text-[11px] font-semibold text-emerald-100 mt-1">
                You have arrived at {destinationBuilding.name}!
              </p>
            </div>
          </div>
          <button onClick={() => setHasArrived(false)} className="p-1 hover:bg-emerald-700 rounded-full text-emerald-100 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Origin, Destination & Travel Mode Controls */}
      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        
        {/* Origin Selector */}
        <div className="space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>START LOCATION</span>
            {useLiveGps ? (
              <span className="text-emerald-600 font-extrabold text-[10px] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                LIVE GPS
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setUseLiveGps(true);
                  if (onOriginChange) onOriginChange('gps');
                }}
                className="text-primary hover:underline font-extrabold text-[10px] flex items-center gap-1 bg-transparent cursor-pointer"
              >
                <Compass size={12} />
                Use GPS
              </button>
            )}
          </label>

          <select
            value={useLiveGps ? 'gps' : originId}
            onChange={(e) => {
              if (e.target.value === 'gps') {
                setUseLiveGps(true);
                if (onOriginChange) onOriginChange('gps');
              } else {
                setUseLiveGps(false);
                handleOriginSelect(e.target.value);
              }
            }}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
          >
            {useLiveGps && <option value="gps">Current Location (GPS Active)</option>}
            {originPresets.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        {/* Destination Selector */}
        <div className="space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
            DESTINATION LOCATION
          </label>
          <select
            value={destinationId}
            onChange={(e) => handleDestinationSelect(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
          >
            {locationList.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.category || 'Academic'})</option>
            ))}
          </select>
        </div>

        {/* Building Entrance Selector (Snapping target entrance) */}
        {buildingEntrances.length > 0 && (
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 text-primary">
              <DoorOpen size={12} />
              <span>SELECT BUILDING ENTRANCE</span>
            </label>
            <select
              value={selectedEntranceId}
              onChange={(e) => setSelectedEntranceId(e.target.value)}
              className="w-full bg-white border border-primary/30 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Default Entrance (Main Gate)</option>
              {buildingEntrances.map(e => (
                <option key={e.id} value={e.id}>
                  {e.entrance_name} {e.is_accessible ? '♿ (Accessible Ramp)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Off-Route Alert Badge */}
        {isOffRouteDetected && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 text-[11px] font-bold flex items-center gap-2 animate-pulse">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
            <span>⚠️ Off-route detected! Recalculating walkable campus path...</span>
          </div>
        )}

        {/* Travel Mode Pills */}
        <div className="space-y-1 pt-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
            TRAVEL MODE
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTravelMode('walking')}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                travelMode === 'walking'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Footprints size={14} />
              <span>Walk</span>
            </button>

            <button
              type="button"
              onClick={() => setTravelMode('cycling')}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                travelMode === 'cycling'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Bike size={14} />
              <span>Cycle</span>
            </button>

            <button
              type="button"
              onClick={() => setTravelMode('wheelchair')}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                travelMode === 'wheelchair'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Accessibility size={14} />
              <span>Accessible</span>
            </button>
          </div>
        </div>

        {gpsError && (
          <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 pt-1">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Action Buttons: Get Directions & Start Navigation */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleGetDirections}
            className="flex-1 bg-primary hover:bg-primaryHover text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <span>Get Directions</span>
            <ArrowRight size={15} />
          </button>

          {!isNavigating ? (
            <button
              type="button"
              onClick={() => {
                handleGetDirections();
                if (onToggleNavigation) onToggleNavigation(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              title="Start Live Turn Navigation"
            >
              <Navigation2 size={16} />
              <span className="hidden sm:inline">Start</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onToggleNavigation) onToggleNavigation(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <StopCircle size={16} />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Calculated Route Details & Turn-by-Turn Steps */}
      {hasCalculatedRoute ? (
        <div className="space-y-4 animate-fade-in">
          {/* Metrics summary card */}
          <div className="grid grid-cols-2 gap-3 bg-blue-50/60 border border-blue-100 p-3.5 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Footprints size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase">Distance</p>
                <p className="text-sm font-extrabold text-slate-800">{nav.formattedDistance}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase">Est. Time</p>
                <p className="text-sm font-extrabold text-slate-800">{nav.timeMinutes} min</p>
              </div>
            </div>
          </div>

          {/* Turn-by-turn list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Step-by-Step Directions</h4>
              <button
                type="button"
                onClick={handleClearRoute}
                className="text-[11px] font-bold text-slate-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} /> Clear Route
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {nav.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">{step.icon}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-normal">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50">
          <MapPin size={24} className="mx-auto text-slate-400" />
          <p className="text-xs font-bold text-slate-600">No Route Calculated Yet</p>
          <p className="text-[11px] text-slate-400 font-medium">Select your start & destination points above and tap <strong>Get Directions</strong> to view your path.</p>
        </div>
      )}
    </div>
  );
};

export default LiveNavigationDrawer;
