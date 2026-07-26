import React, { useState, useEffect } from 'react';
import { CAMPUS_MAP_DATA } from '../../config/mapData';
import { Navigation, MapPin, Compass, Clock, Footprints, CheckCircle2, AlertCircle, Navigation2, X, StopCircle, PartyPopper } from 'lucide-react';

const getOriginPresets = () => {
  const mainGate = CAMPUS_MAP_DATA.find(b => b.id === 'main-gate') || { gps: { lat: 10.7543, lng: 78.6528 } };
  const boysHostel = CAMPUS_MAP_DATA.find(b => b.id === 'boys-hostel') || { gps: { lat: 10.7584, lng: 78.6514 } };
  const girlsHostel = CAMPUS_MAP_DATA.find(b => b.id === 'girls-hostel') || { gps: { lat: 10.7580, lng: 78.6522 } };
  const centralLibrary = CAMPUS_MAP_DATA.find(b => b.id === 'bd-block') || { gps: { lat: 10.7576, lng: 78.6516 } };
  const canteen = CAMPUS_MAP_DATA.find(b => b.id === 'cafeteria') || { gps: { lat: 10.7572, lng: 78.6512 } };

  return [
    { id: 'main-gate', name: 'Main Entrance Security Gate', coords: { lat: mainGate.gps.lat, lng: mainGate.gps.lng } },
    { id: 'boys-hostel', name: 'Boys Hostel Entrance', coords: { lat: boysHostel.gps.lat, lng: boysHostel.gps.lng } },
    { id: 'girls-hostel', name: 'Girls Hostel Entrance', coords: { lat: girlsHostel.gps.lat, lng: girlsHostel.gps.lng } },
    { id: 'central-library', name: 'BD Block Library Ground', coords: { lat: centralLibrary.gps.lat, lng: centralLibrary.gps.lng } },
    { id: 'canteen', name: 'Main Canteen & Food Court', coords: { lat: canteen.gps.lat, lng: canteen.gps.lng } }
  ];
};

const ORIGIN_PRESETS = getOriginPresets();

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
    const destGps = destinationBuilding.gps || CAMPUS_MAP_DATA[0].gps;

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

    // Dynamic Step-by-Step Directions Generator based on Spatial Regions
    const steps = [];
    const originName = useLiveGps ? 'Your Live GPS Location' : originPreset.name;
    const destName = destinationBuilding.name;
    const destDept = destinationBuilding.departments?.[0] || '';
    const nearby = destinationBuilding.nearby_facilities?.[0] || '';

    steps.push({ text: `Start walking from ${originName}.`, icon: 'my_location' });

    if (originId === 'main-gate') {
      steps.push({ text: 'Pass through the main security gate, keeping the Security Room on your left.', icon: 'straight' });
      steps.push({ text: 'Head north along the main central avenue past the student parking lot.', icon: 'straight' });
    } else if (originId === 'boys-hostel') {
      steps.push({ text: 'Depart from the Boys Hostel entrance toward the staff parking lot.', icon: 'south' });
    } else if (originId === 'girls-hostel') {
      steps.push({ text: 'Head west from the Girls Hostel gate toward the main central avenue.', icon: 'west' });
    } else if (originId === 'canteen') {
      steps.push({ text: 'Exit the Food Court and turn onto the pathway past the ECE block.', icon: 'turn_right' });
    } else {
      steps.push({ text: 'Head onto the nearest paved path toward the central corridor.', icon: 'compass_calibration' });
    }

    const isSportsField = destinationBuilding.category === 'Sports' || ['toilet', 'tnsca-office'].includes(destinationBuilding.id);
    const isAcademicRow = destinationBuilding.category === 'Academic' && ['ks-block', 'rv-block', 'bd-block', 'js-block', 'temple', 'atm'].includes(destinationBuilding.id);
    const isWorkshopCanteen = ['mech-workshop', 'me-block', 'mech-lab', 'cafeteria', 'stationery', 'generator-room'].includes(destinationBuilding.id);

    if (isSportsField) {
      if (originId === 'main-gate') {
        steps.push({ text: 'Turn left onto the unpaved sports path before Ganesha Temple.', icon: 'turn_left' });
      } else {
        steps.push({ text: 'Walk south-west toward the practice grounds on the west side.', icon: 'south_west' });
      }
      steps.push({ text: 'Follow the dirt path past the practice nets, keeping Cricket Ground 1 on your right.', icon: 'straight' });
    } else if (isAcademicRow) {
      if (originId === 'main-gate') {
        steps.push({ text: 'Continue straight along the central avenue past the CUB ATM.', icon: 'straight' });
        steps.push({ text: 'Turn right at Ganesha Temple junction into the academic quad.', icon: 'turn_right' });
      } else {
        steps.push({ text: 'Walk south-east past the Staff Parking lot to the academic courtyard.', icon: 'straight' });
      }
      if (destinationBuilding.id === 'bd-block') {
        steps.push({ text: 'Walk north past JS block to reach the BD Block Library complex.', icon: 'north' });
      } else if (destinationBuilding.id === 'ks-block') {
        steps.push({ text: 'Proceed south toward K. Santhanam Block.', icon: 'south' });
      }
    } else if (isWorkshopCanteen) {
      steps.push({ text: 'Walk toward the volleyball sand court, turning towards the western labs.', icon: 'turn_left' });
      steps.push({ text: 'Proceed past the main Canteen building to find the workshop entrance.', icon: 'straight' });
    } else if (destinationBuilding.id === 'boys-hostel') {
      steps.push({ text: 'Proceed north all the way to the far end of the campus road, past the bus bay.', icon: 'north' });
    } else {
      steps.push({ text: 'Follow the central campus avenue toward the destination building.', icon: 'straight' });
    }

    if (nearby) {
      steps.push({ text: `You will find ${nearby} located in the immediate vicinity.`, icon: 'explore' });
    }
    steps.push({ text: `Arrive at ${destName}. ${destDept ? `Enter the main foyer for ${destDept}.` : 'Entrance is straight ahead.'}`, icon: 'where_to_vote' });

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
