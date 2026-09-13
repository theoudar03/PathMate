import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CAMPUS_MAP_DATA, isValidGps } from '../../config/mapData';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import TranslateText from '../common/TranslateText';
import {
  buildGraph,
  findShortestPathAStar,
  snapToNearestNode
} from '../../services/routingEngine';
import { 
  MapPin, 
  Navigation, 
  Layers, 
  Eye, 
  Building, 
  Clock, 
  Users, 
  X, 
  Lightbulb, 
  Navigation2, 
  PartyPopper, 
  Maximize, 
  Minimize, 
  Locate, 
  Compass, 
  Plus, 
  Minus 
} from 'lucide-react';

const getOriginPresetsMap = () => {
  const mainGate = CAMPUS_MAP_DATA.find(b => b.id === 'main-gate') || { gps: { lat: 10.7543, lng: 78.6528 } };
  const boysHostel = CAMPUS_MAP_DATA.find(b => b.id === 'boys-hostel') || { gps: { lat: 10.7584, lng: 78.6514 } };
  const girlsHostel = CAMPUS_MAP_DATA.find(b => b.id === 'girls-hostel') || { gps: { lat: 10.7580, lng: 78.6522 } };
  const centralLibrary = CAMPUS_MAP_DATA.find(b => b.id === 'bd-block') || { gps: { lat: 10.7576, lng: 78.6516 } };
  const canteen = CAMPUS_MAP_DATA.find(b => b.id === 'cafeteria') || { gps: { lat: 10.7572, lng: 78.6512 } };

  return {
    'main-gate': { name: 'Main Entrance Gate', lat: mainGate.gps.lat, lng: mainGate.gps.lng },
    'boys-hostel': { name: 'Boys Hostel', lat: boysHostel.gps.lat, lng: boysHostel.gps.lng },
    'girls-hostel': { name: 'Girls Hostel', lat: girlsHostel.gps.lat, lng: girlsHostel.gps.lng },
    'central-library': { name: 'Central Library', lat: centralLibrary.gps.lat, lng: centralLibrary.gps.lng },
    'canteen': { name: 'Main Canteen', lat: canteen.gps.lat, lng: canteen.gps.lng }
  };
};

const ORIGIN_PRESETS_MAP = getOriginPresetsMap();

// Base Style containing Google raster sources and CartoDB Dark Matter tile source
const BASE_MAP_STYLE = {
  version: 8,
  sources: {
    'google-satellite': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
      ],
      tileSize: 256,
      attribution: 'Google Maps Satellite | SCE'
    },
    'google-hybrid': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
      ],
      tileSize: 256,
      attribution: 'Google Maps Hybrid | SCE'
    },
    'google-roadmap': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
      ],
      tileSize: 256,
      attribution: 'Google Maps Roadmap | SCE'
    },
    'cartodb-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO'
    }
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'google-satellite',
      layout: { visibility: 'none' }
    },
    {
      id: 'hybrid-layer',
      type: 'raster',
      source: 'google-hybrid',
      layout: { visibility: 'none' }
    },
    {
      id: 'roadmap-layer',
      type: 'raster',
      source: 'google-roadmap',
      layout: { visibility: 'none' }
    },
    {
      id: 'cartodb-dark-layer',
      type: 'raster',
      source: 'cartodb-dark',
      layout: { visibility: 'none' }
    }
  ]
};

const SatelliteMapView = ({ 
  onSelectBuildingForNavigation, 
  searchQuery = '', 
  userLocation, 
  activeDestination,
  locations = [],
  routingGraph = { nodes: [], edges: [], building_entrances: [], campus_obstacles: [] },
  originId = 'main-gate',
  isNavigating = false,
  onToggleNavigation
}) => {
  const { resolvedTheme } = useTheme();
  const { t } = useApp();
  const [mapType, setMapType] = useState('hybrid');
  const locationList = (locations && locations.length > 0) ? locations : CAMPUS_MAP_DATA;
  const [selectedBuilding, setSelectedBuilding] = useState(activeDestination || locationList[0]);
  const [hasArrived, setHasArrived] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getDisplayName = (item) => {
    if (!item) return '';
    const rawId = item.id || item.svg_id || '';
    if (rawId) {
      const translation = t('mapBlock_' + rawId);
      if (translation && typeof translation === 'string' && !translation.startsWith('mapBlock_')) {
        return translation;
      }
    }
    return item.name || item.block_name || item.building_name || 'Location';
  };

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const lastFitBoundsKey = useRef('');

  // Sync activeDestination from props if passed
  useEffect(() => {
    if (activeDestination) {
      setSelectedBuilding(activeDestination);
      setHasArrived(false);
      
      // Fly to target destination
      if (mapInstanceRef.current && (activeDestination.gps || (activeDestination.latitude && activeDestination.longitude))) {
        const lat = activeDestination.gps ? activeDestination.gps.lat : parseFloat(activeDestination.latitude);
        const lng = activeDestination.gps ? activeDestination.gps.lng : parseFloat(activeDestination.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          mapInstanceRef.current.flyTo({
            center: [lng, lat],
            zoom: 18,
            pitch: 45,
            speed: 1.2,
            curve: 1.4,
            essential: true
          });
        }
      }
    }
  }, [activeDestination]);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center at Saranathan Campus
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASE_MAP_STYLE,
      center: [78.6520, 10.7565],
      zoom: 16.5,
      pitch: 0,
      bearing: 0,
      maxZoom: 20,
      minZoom: 13
    });

    mapInstanceRef.current = map;
    map.on('load', () => {
      // Toggle initial map type layer visibility
      const initialLayer = (mapType === 'roadmap' && resolvedTheme === 'dark') ? 'cartodb-dark' : mapType;
      map.setLayoutProperty(`${initialLayer}-layer`, 'visibility', 'visible');
 
      // Add route GeoJSON source and layer
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });
 
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': resolvedTheme === 'dark' ? '#60A5FA' : '#2563EB',
          'line-width': 5.5,
          'line-opacity': 0.85
        }
      });

      // Add markers
      renderBuildingMarkers();
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Re-render markers when locationList or selectedBuilding changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      renderBuildingMarkers();
    }
  }, [locationList, selectedBuilding]);

  // Update Tile Layers when mapType or theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    ['satellite', 'hybrid', 'roadmap', 'cartodb-dark'].forEach(type => {
      let isVisible = false;
      if (type === 'satellite') isVisible = mapType === 'satellite';
      else if (type === 'hybrid') isVisible = mapType === 'hybrid';
      else if (type === 'roadmap') isVisible = mapType === 'roadmap' && resolvedTheme === 'light';
      else if (type === 'cartodb-dark') isVisible = mapType === 'roadmap' && resolvedTheme === 'dark';

      map.setLayoutProperty(
        `${type}-layer`,
        'visibility',
        isVisible ? 'visible' : 'none'
      );
    });

    if (map.getLayer('route-line')) {
      map.setPaintProperty(
        'route-line',
        'line-color',
        resolvedTheme === 'dark' ? '#60A5FA' : '#2563EB'
      );
    }
  }, [mapType, resolvedTheme]);

  // Create clean location markers for buildings (clutter-free, category icons, highlighted on selection)
  const renderBuildingMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const getCategoryBadgeStyles = (cat) => {
      const safeCat = String(cat || 'Location');
      const c = safeCat.toLowerCase();
      if (c.includes('academic')) return { text: 'ACADEMIC', color: '#60A5FA', pinColor: '#1B4DA6', icon: 'school' };
      if (c.includes('hostel')) return { text: 'HOSTEL', color: '#A78BFA', pinColor: '#3F51B5', icon: 'bed' };
      if (c.includes('sports')) return { text: 'SPORTS', color: '#4ADE80', pinColor: '#2E7D32', icon: 'sports_soccer' };
      if (c.includes('transport')) return { text: 'TRANSPORT', color: '#94A3B8', pinColor: '#607D8B', icon: 'directions_bus' };
      if (c.includes('utilit')) return { text: 'UTILITY', color: '#F87171', pinColor: '#757575', icon: 'build' };
      if (c.includes('service') || c.includes('dining')) return { text: 'SERVICES', color: '#FDBA74', pinColor: '#E65100', icon: 'restaurant' };
      if (c.includes('religi')) return { text: 'RELIGIOUS', color: '#FBBF24', pinColor: '#FFA000', icon: 'temple_hindu' };
      if (c.includes('entrance') || c.includes('landmark')) return { text: 'LANDMARK', color: '#FDBA74', pinColor: '#E65100', icon: 'place' };
      return { text: safeCat.toUpperCase(), color: '#FFFFFF', pinColor: '#2563EB', icon: 'location_on' };
    };

    locationList.forEach(building => {
      if (!building || building.hideMarker) return;
      const lat = building.gps ? building.gps.lat : parseFloat(building.latitude);
      const lng = building.gps ? building.gps.lng : parseFloat(building.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected = selectedBuilding?.id === building.id || selectedBuilding?.name === building.name;
      const badgeStyles = getCategoryBadgeStyles(building.category);

      const el = document.createElement('div');
      el.className = 'group cursor-pointer select-none relative';
      const safeName = building.name || 'Campus Location';
      const safeCategory = building.category || 'Location';
      el.setAttribute('aria-label', `${safeName} (${safeCategory})`);
      el.setAttribute('title', `${safeName} — ${safeCategory}`);

      el.innerHTML = `
        <div class="flex flex-col items-center justify-center transition-transform duration-200 hover:scale-125 ${isSelected ? 'scale-125 z-30' : 'scale-100 z-10'}">
          <!-- Marker Circle Pin -->
          <div class="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-all ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2 animate-bounce' : ''}" style="background-color: ${badgeStyles.pinColor};">
            <span class="material-symbols-outlined text-[16px] text-white select-none">${badgeStyles.icon}</span>
          </div>
          <!-- Label capsule visible on selection or hover -->
          <div class="${isSelected ? 'flex' : 'hidden group-hover:flex'} mt-1 bg-[#0F172A]/90 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-slate-700/60 shadow-xl text-[10px] font-extrabold text-center flex-col items-center leading-tight">
            <span>${building.name}</span>
            <span class="text-[8px] font-black uppercase tracking-wider" style="color: ${badgeStyles.color};">${badgeStyles.text}</span>
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedBuilding(building);
        setHasArrived(false);
        if (onSelectBuildingForNavigation) {
          onSelectBuildingForNavigation(building);
        }
        map.flyTo({
          center: [lng, lat],
          zoom: 18,
          pitch: 45,
          speed: 1.2
        });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  // Camera, Navigation & GPS Location Logic
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // 1. Source Origin Coordinates
    let sourceLat = 10.7544;
    let sourceLng = 78.6534;

    if (originId === 'gps' && userLocation?.lat && userLocation?.lng) {
      if (isValidGps(userLocation)) {
        sourceLat = userLocation.lat;
        sourceLng = userLocation.lng;
      } else {
        console.warn(`[GPS Validation] User location is out-of-bounds:`, userLocation);
      }
    } else if (ORIGIN_PRESETS_MAP[originId]) {
      const preset = ORIGIN_PRESETS_MAP[originId];
      if (isValidGps({ lat: preset.lat, lng: preset.lng })) {
        sourceLat = preset.lat;
        sourceLng = preset.lng;
      } else {
        console.warn(`[GPS Validation] Preset location "${originId}" is out-of-bounds:`, preset);
      }
    }

    // Update User Animated Geolocation Marker Pin
    if (userLocation?.lat && userLocation?.lng && isValidGps(userLocation)) {
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center w-8 h-8 pointer-events-none';
        el.innerHTML = `
          <span class="absolute inline-flex w-full h-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-lg"></span>
        `;
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      }
    }

    // 2. Target Destination Coordinate Details
    const targetBuilding = activeDestination || (searchQuery ? CAMPUS_MAP_DATA.find(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.departments.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : null) || selectedBuilding || CAMPUS_MAP_DATA[0];

    if (targetBuilding && targetBuilding.gps && isValidGps(targetBuilding.gps)) {
      const destLat = targetBuilding.gps.lat;
      const destLng = targetBuilding.gps.lng;

      // 3. Haversine distance tracking
      const R = 6371e3;
      const φ1 = sourceLat * Math.PI / 180;
      const φ2 = destLat * Math.PI / 180;
      const Δφ = (destLat - sourceLat) * Math.PI / 180;
      const Δλ = (destLng - sourceLng) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = Math.round(R * c);

      if (isNavigating && distanceMeters <= 20) {
        setHasArrived(true);
      } else {
        setHasArrived(false);
      }

      // Draw walking route line dynamically along waypoints
      if (isNavigating) {
        let pathPoints = [];
        const nodes = routingGraph.nodes && routingGraph.nodes.length > 0 ? routingGraph.nodes : [];
        const edges = routingGraph.edges && routingGraph.edges.length > 0 ? routingGraph.edges : [];

        if (nodes.length > 0 && edges.length > 0) {
          const graph = buildGraph(nodes, edges);
          const startNode = snapToNearestNode({ lat: sourceLat, lng: sourceLng }, nodes);
          const endNode = snapToNearestNode({ lat: destLat, lng: destLng }, nodes);

          if (startNode && endNode) {
            const pathNodeIds = findShortestPathAStar(graph, startNode.id, endNode.id, nodes);
            const nodeMap = new Map(nodes.map(n => [n.id, n]));
            pathPoints = pathNodeIds
              .map(id => nodeMap.get(id))
              .filter(Boolean)
              .map(n => [parseFloat(n.longitude), parseFloat(n.latitude)]);
          }
        }

        if (pathPoints.length === 0) {
          pathPoints = [[sourceLng, sourceLat], [destLng, destLat]];
        } else {
          pathPoints[0] = [sourceLng, sourceLat];
          pathPoints[pathPoints.length - 1] = [destLng, destLat];
        }

        const routeSource = map.getSource('route');
        if (routeSource) {
          routeSource.setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: pathPoints
            }
          });
        }
      } else {
        // Clear route line
        const routeSource = map.getSource('route');
        if (routeSource) {
          routeSource.setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          });
        }
      }

      // Update Fit camera bounds viewport key
      const boundsKey = `${sourceLat}_${sourceLng}_${destLat}_${destLng}_${targetBuilding.id}_${isNavigating}`;
      if (lastFitBoundsKey.current !== boundsKey) {
        lastFitBoundsKey.current = boundsKey;
        
        let coordinates = [
          [sourceLng, sourceLat],
          [destLng, destLat]
        ];

        if (isNavigating) {
          const routeSource = map.getSource('route');
          const routeData = routeSource?._data || routeSource?.data;
          if (routeData?.geometry?.coordinates?.length > 0) {
            coordinates = routeData.geometry.coordinates;
          }
        }
        
        const bounds = coordinates.reduce((acc, coord) => {
          return acc.extend(coord);
        }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

        map.fitBounds(bounds, {
          padding: 85,
          maxZoom: 18.5,
          duration: 1600
        });
      }
    }
  }, [selectedBuilding, activeDestination, searchQuery, userLocation, originId, isNavigating]);

  // Floating Control Bar Button Actions
  const zoomIn = () => mapInstanceRef.current?.zoomIn();
  const zoomOut = () => mapInstanceRef.current?.zoomOut();
  const resetNorth = () => mapInstanceRef.current?.resetNorthPitch();
  
  const locateMe = () => {
    if (userLocation?.lat && userLocation?.lng && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 18.5,
        pitch: 45,
        speed: 1.5
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.resize();
    }, 100);
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden shadow-elevation2 border border-outline/30 bg-slate-100 select-none text-left font-sans animate-fade-in touch-pan-y transition-all ${
      isFullscreen ? 'fixed inset-0 z-[1000] rounded-none border-none h-screen' : 'h-[480px] sm:h-[650px]'
    }`}>
      {/* Floating Header public bar */}
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

        {/* Map Type Toggle */}
        <div className="flex items-center gap-1 bg-surfaceContainerLow p-1 rounded-full border border-outline/20 text-xs w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setMapType('hybrid')}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mapType === 'hybrid' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <Eye size={12} />
            <span>Hybrid (Recommended)</span>
          </button>

          <button
            onClick={() => setMapType('satellite')}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mapType === 'satellite' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <Layers size={12} />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => setMapType('roadmap')}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mapType === 'roadmap' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <Building size={12} />
            <span>Roadmap</span>
          </button>
        </div>
      </div>

      {/* Floating controls panel */}
      <div className="absolute right-3 bottom-24 sm:top-20 sm:bottom-auto sm:right-4 z-[500] flex flex-col gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-outline/20">
        <button onClick={zoomIn} className="p-2 hover:bg-slate-100 text-slate-700 rounded-xl cursor-pointer" title={t('zoomIn') || "Zoom In"}>
          <Plus size={16} />
        </button>
        <button onClick={zoomOut} className="p-2 hover:bg-slate-100 text-slate-700 rounded-xl cursor-pointer" title={t('zoomOut') || "Zoom Out"}>
          <Minus size={16} />
        </button>
        <button onClick={resetNorth} className="p-2 hover:bg-slate-100 text-slate-700 rounded-xl cursor-pointer" title={t('recenterCompass') || "Recenter Compass"}>
          <Compass size={16} />
        </button>
        <button 
          onClick={locateMe} 
          disabled={!userLocation} 
          className={`p-2 rounded-xl cursor-pointer ${userLocation ? 'hover:bg-slate-100 text-blue-600' : 'text-slate-350'}`} 
          title={t('centerGps') || "Center on GPS Location"}
        >
          <Locate size={16} />
        </button>
        <button onClick={toggleFullscreen} className="p-2 hover:bg-slate-100 text-slate-700 rounded-xl cursor-pointer" title={t('toggleFullscreen') || "Toggle Fullscreen"}>
          <Maximize size={16} />
        </button>
      </div>

      {/* Destination Arrival Celebration Pill */}
      {hasArrived && (
        <div className="absolute top-20 left-4 right-4 z-[550] bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-white animate-bounce flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PartyPopper size={22} className="text-yellow-300 animate-spin" />
            <div>
              <h4 className="text-xs font-black">🎉 {t('reachedTitle') || 'You Have Arrived!'}</h4>
              <p className="text-[11px] font-bold text-emerald-100 mt-0.5">
                {t('reachedBody') 
                  ? t('reachedBody').replace('{dest}', getDisplayName(selectedBuilding) || 'Destination')
                  : `Welcome to ${getDisplayName(selectedBuilding) || 'Destination'}! Have a great day!`}
              </p>
            </div>
          </div>
          <button onClick={() => setHasArrived(false)} className="p-1 hover:bg-emerald-700 rounded-full cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Small Clean Helpful Banner Pill */}
      <div className="absolute bottom-4 left-4 z-[490] max-w-[85vw] sm:max-w-md bg-amber-50/95 backdrop-blur-md text-amber-900 text-[10.5px] font-bold px-3.5 py-1.5 rounded-full border border-amber-300 shadow-md flex items-center gap-1.5">
        <Lightbulb size={13} className="text-amber-600 flex-shrink-0" />
        <span className="truncate">{t('mapTiltedTips') || '💡 Use compass & zoom floating bar on the right to tilt & rotate 3D maps.'}</span>
      </div>

      {/* MapLibre Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 touch-pan-y" />

      {/* Restore Floating Light MD3 Building Information Card Popup */}
      {selectedBuilding && (
        <div className="relative sm:absolute sm:top-28 sm:right-4 sm:bottom-4 sm:w-96 w-full bg-white border border-outline/30 rounded-3xl p-4 sm:p-5 text-onSurface z-[600] flex flex-col justify-between shadow-elevation3 animate-scale-up overflow-y-auto mt-4 sm:mt-0 max-h-[400px] sm:max-h-none text-left">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-start border-b border-outline/20 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primaryContainer/60 px-2.5 py-0.5 rounded-full border border-primaryContainer">
                  {t('mapCategory_' + selectedBuilding.category) || selectedBuilding.category}
                </span>
                <h2 className="text-base font-black text-onSurface mt-1.5 leading-tight">{getDisplayName(selectedBuilding)}</h2>
              </div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="w-full h-32 sm:h-36 rounded-2xl overflow-hidden bg-slate-100 border border-outline/20 shadow-xs relative">
              <img
                src={selectedBuilding.image || '/assets/campus-bg.jpg'}
                alt={getDisplayName(selectedBuilding)}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/campus-bg.jpg';
                }}
              />
            </div>

            <p className="text-xs text-onSurfaceVariant leading-relaxed">
              {selectedBuilding.description ? <TranslateText text={selectedBuilding.description} /> : ''}
            </p>

            {selectedBuilding.departments && selectedBuilding.departments.length > 0 && (
              <div>
                <strong className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Building size={14} className="text-primary" /> {t('departmentsLabel') || 'Departments & Wings'}
                </strong>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBuilding.departments.map(d => (
                    <span key={d} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-semibold border border-outline/20">
                      <TranslateText text={d} />
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-outline/20">
              <div className="flex items-center gap-2 text-onSurfaceVariant">
                <Clock size={14} className="text-primary flex-shrink-0" />
                <span><strong className="text-onSurface">{t('hoursLabel') || 'Hours:'}</strong> {selectedBuilding.office_timing || '8:30 AM - 5:00 PM'}</span>
              </div>
              {selectedBuilding.faculty && (
                <div className="flex items-center gap-2 text-onSurfaceVariant">
                  <Users size={14} className="text-green-600 flex-shrink-0" />
                  <span><strong className="text-onSurface">{t('headLabel') || 'Head:'}</strong> {selectedBuilding.faculty.join(', ')}</span>
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
                className="w-full bg-gradient-to-r from-primary to-[#2563EB] hover:from-primaryHover hover:to-primary text-white py-3.5 rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-primary/20 cursor-pointer"
              >
                <Navigation2 size={16} className="fill-white" />
                <span>{t('startLiveNav') || 'Start Live Navigation'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onToggleNavigation) onToggleNavigation(false);
                }}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-3.5 rounded-2xl font-black text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <X size={16} className="text-rose-600" />
                <span>{t('stopLiveNav') || 'Stop Live Navigation'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteMapView;
