import React, { useState, useEffect } from 'react';
import { CAMPUS_MAP_DATA } from '../../config/mapData';
import { Navigation, MapPin, Compass, Clock, Footprints, CheckCircle2, AlertCircle, Navigation2, X, StopCircle, PartyPopper } from 'lucide-react';

const ORIGIN_PRESETS = [
  { id: 'main-gate', name: 'Main Entrance Security Gate', coords: { lat: 10.7542, lng: 78.6538 } },
  { id: 'boys-hostel', name: 'Boys Hostel Entrance', coords: { lat: 10.7588, lng: 78.6522 } },
  { id: 'girls-hostel', name: 'Girls Hostel Entrance', coords: { lat: 10.7580, lng: 78.6530 } },
  { id: 'central-library', name: 'BD Block Library Ground', coords: { lat: 10.7572, lng: 78.6520 } },
  { id: 'canteen', name: 'Main Canteen & Food Court', coords: { lat: 10.7566, lng: 78.6513 } }
];

const LiveNavigationDrawer = ({ 
  initialDestination, 
  onClose, 
  onUserLocationUpdate,
  isNavigating = false,
  onToggleNavigation,
  onOriginChange,
  onDestinationChange
}) => {
  const [originId, setOriginId] = useState('main-gate');
  const [destinationId, setDestinationId] = useState(initialDestination?.id || 'ks-block');
  const [useLiveGps, setUseLiveGps] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [currentGpsCoords, setCurrentGpsCoords] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);

  // Sync initial destination from parent props when selected
  useEffect(() => {
    if (initialDestination?.id) {
      setDestinationId(initialDestination.id);
      setHasArrived(false);
    }
  }, [initialDestination]);

  // Handle Origin Dropdown Change
  const handleOriginSelect = (id) => {
    setOriginId(id);
    setHasArrived(false);
    if (onOriginChange) onOriginChange(id);
  };

  // Handle Destination Dropdown Change
  const handleDestinationSelect = (id) => {
    setDestinationId(id);
    setHasArrived(false);
    const building = CAMPUS_MAP_DATA.find(b => b.id === id);
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
          setGpsError('Unable to detect current location. Using campus origin presets.');
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

  const destinationBuilding = CAMPUS_MAP_DATA.find(b => b.id === destinationId) || CAMPUS_MAP_DATA[0];
  const originPreset = ORIGIN_PRESETS.find(o => o.id === originId) || ORIGIN_PRESETS[0];

  // Calculate live walking distance and time continuously
  const calculateNavigationDetails = () => {
    const origGps = (useLiveGps && currentGpsCoords && currentGpsCoords.lat) ? currentGpsCoords : originPreset.coords;
    const destGps = destinationBuilding.gps || { lat: 10.7565, lng: 78.6525 };

    const R = 6371e3;
    const φ1 = origGps.lat * Math.PI/180;
    const φ2 = destGps.lat * Math.PI/180;
    const Δφ = (destGps.lat-origGps.lat) * Math.PI/180;
    const Δλ = (destGps.lng-origGps.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceMeters = Math.round(R * c);

    const formattedDistance = distanceMeters >= 1000
      ? `${(distanceMeters / 1000).toFixed(1)} km`
      : `${distanceMeters} Meters`;

    const timeMinutes = Math.max(1, Math.round(distanceMeters / 70));

    const steps = [
      { text: `Start walking from ${useLiveGps ? 'Your Live GPS Location' : originPreset.name}`, icon: 'my_location' },
      { text: `Head along central paved avenue past Ganesha Temple`, icon: 'straight' },
      { text: `Pass by ${destinationBuilding.nearby_facilities?.[0] || 'BD Block Library'} on your right`, icon: 'turn_right' },
      { text: `Arrive at ${destinationBuilding.name} (${destinationBuilding.departments?.[0] || 'Main Wing'})`, icon: 'where_to_vote' }
    ];

    return { distanceMeters, formattedDistance, timeMinutes, steps };
  };

  const nav = calculateNavigationDetails();

  // Check arrival status (<= 15 meters) when navigating
  useEffect(() => {
    if (isNavigating && nav.distanceMeters <= 20) {
      setHasArrived(true);
    }
  }, [isNavigating, nav.distanceMeters]);

  return (
    <div className="bg-white border border-outline/30 rounded-3xl p-6 shadow-elevation2 space-y-5 text-left font-sans animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-outline/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black shadow-xs">
            <Navigation size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-onSurface">Campus Walking Directions</h2>
            <p className="text-xs text-onSurfaceVariant">Real-Time GPS & Live Distance Tracking</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-slate-100">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Destination Arrival Celebration Message */}
      {hasArrived && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg border border-emerald-500 animate-bounce flex items-start justify-between">
          <div className="flex items-start gap-3">
            <PartyPopper size={24} className="text-yellow-300 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black">🎉 Destination Reached!</h4>
              <p className="text-[11px] font-semibold text-emerald-100 mt-1">
                You have arrived at <strong>{destinationBuilding.name}</strong>! Have a wonderful day on campus!
              </p>
            </div>
          </div>
          <button onClick={() => setHasArrived(false)} className="p-1 hover:bg-emerald-700 rounded-full text-emerald-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Starting Location & Destination Selectors */}
      <div className="space-y-3 bg-surfaceContainerLow p-4 rounded-2xl border border-outline/20">
        {/* Starting Location */}
        <div>
          <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>SOURCE ADDRESS / START LOCATION</span>
            {useLiveGps ? (
              <span className="text-green-700 font-bold text-[10px] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-600 animate-ping" />
                LIVE GPS TRACKING
              </span>
            ) : (
              <button
                onClick={() => {
                  setUseLiveGps(true);
                  if (onOriginChange) onOriginChange('gps');
                }}
                className="text-primary hover:underline font-bold text-[10px] flex items-center gap-1"
              >
                <Compass size={12} />
                Detect GPS
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
            className="w-full bg-white border border-outline/40 rounded-xl py-2.5 px-3.5 text-xs font-bold text-onSurface shadow-xs"
          >
            {useLiveGps && (
              <option value="gps">Current Location (GPS Active)</option>
            )}
            {ORIGIN_PRESETS.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        {/* Destination Address */}
        <div>
          <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">
            DESTINATION ADDRESS / BUILDING
          </label>
          <select
            value={destinationId}
            onChange={(e) => handleDestinationSelect(e.target.value)}
            className="w-full bg-white border border-outline/40 rounded-xl py-2.5 px-3.5 text-xs font-bold text-onSurface shadow-xs"
          >
            {CAMPUS_MAP_DATA.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {gpsError && (
          <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 pt-1">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Professional Material Design 3 Start / Stop Navigation Button */}
      <div>
        {!isNavigating ? (
          <button
            onClick={() => {
              if (onToggleNavigation) onToggleNavigation(true);
            }}
            className="w-full bg-gradient-to-r from-primary to-[#2563EB] hover:from-primaryHover hover:to-primary text-white py-3.5 rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] border border-primary/20"
          >
            <Navigation2 size={18} className="fill-white" />
            <span>Start Live Navigation</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (onToggleNavigation) onToggleNavigation(false);
            }}
            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-3.5 rounded-2xl font-black text-xs shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          >
            <StopCircle size={18} className="text-rose-600" />
            <span>Stop Live Navigation</span>
          </button>
        )}
      </div>

      {/* Live Walking Summary Stats Card (Continuously updates distance as user moves) */}
      <div className="grid grid-cols-2 gap-3 bg-primaryContainer/30 border border-primaryContainer p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-xs">
            <Footprints size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">LIVE DISTANCE</span>
            <span className="text-base font-black text-primary animate-pulse">{nav.formattedDistance}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">EST. TIME</span>
            <span className="text-base font-black text-emerald-700">{nav.timeMinutes} Mins</span>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Instruction Steps */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
          Step-by-Step Directions
        </h4>

        <div className="space-y-2">
          {nav.steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-surfaceContainerLow border border-outline/20 text-xs">
              <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5 select-none">
                {step.icon}
              </span>
              <span className="font-semibold text-onSurface leading-snug">{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveNavigationDrawer;
