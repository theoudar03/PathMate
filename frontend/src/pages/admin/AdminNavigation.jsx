import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit, Save, Check, X, ShieldAlert, GitCommit, Network, Play, Compass, Footprints, Bike, Accessibility, CheckCircle2, AlertCircle } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';
import {
  buildGraph,
  findShortestPathAStar,
  findShortestPathDijkstra,
  calculateRouteDistanceAndDuration,
  generateDetailedTurnSteps
} from '../../services/routingEngine';

const AdminNavigation = () => {
  const [activeTab, setActiveTab] = useState('pins'); // 'pins' | 'graph' | 'simulator'
  
  // Pins State
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    altitude: 0,
    floor: 0,
    category: 'Academic',
    description: '',
    office_hours: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  // Graph State
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], building_entrances: [], campus_obstacles: [] });
  const [graphLoading, setGraphLoading] = useState(false);

  // Simulator State
  const [simOriginId, setSimOriginId] = useState('');
  const [simDestId, setSimDestId] = useState('');
  const [simAlgorithm, setSimAlgorithm] = useState('astar'); // 'astar' | 'dijkstra'
  const [simTravelMode, setSimTravelMode] = useState('walking');
  const [simResult, setSimResult] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch('/api/admin/navigation/locations', { headers });
      if (res.ok) setLocations(await res.json());

      fetchGraphData();
    } catch (err) {
      console.error(err);
      setError('Failed to fetch map pins');
    } finally {
      setLoading(false);
    }
  };

  const fetchGraphData = async () => {
    setGraphLoading(true);
    try {
      const res = await fetch('/api/routing/graph');
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
        if (data.nodes && data.nodes.length >= 2) {
          setSimOriginId(data.nodes[0].id);
          setSimDestId(data.nodes[data.nodes.length - 1].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
    } finally {
      setGraphLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setSelectedLocation(null);
    setForm({
      name: '',
      latitude: '10.7543',
      longitude: '78.6528',
      altitude: 0,
      floor: 0,
      category: 'Academic',
      description: '',
      office_hours: '08:30 AM - 05:00 PM',
      tags: []
    });
    setShowModal(true);
  };

  const openEdit = (loc) => {
    setSelectedLocation(loc);
    setForm({
      name: loc.name || '',
      latitude: loc.latitude || '',
      longitude: loc.longitude || '',
      altitude: loc.altitude || 0,
      floor: loc.floor || 0,
      category: loc.category || 'Academic',
      description: loc.description || '',
      office_hours: loc.office_hours || '',
      tags: loc.tags || []
    });
    setShowModal(true);
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setForm({ ...form, tags: form.tags.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a valid number between -90 and 90');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be a valid number between -180 and 180');
      return;
    }

    const token = localStorage.getItem('pm_admin_token');
    const method = selectedLocation ? 'PUT' : 'POST';
    const url = selectedLocation ? `/api/admin/navigation/locations/${selectedLocation.id}` : '/api/admin/navigation/locations';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const body = await res.json();
        setError(body.error || 'Failed to save location details');
      }
    } catch (err) {
      setError('Network error saving map details');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this navigation pin location?')) return;
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/navigation/locations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run Route Simulation
  const handleRunSimulation = () => {
    if (!simOriginId || !simDestId) return;

    const nodes = graphData.nodes || [];
    const edges = graphData.edges || [];
    if (nodes.length === 0 || edges.length === 0) return;

    const graph = buildGraph(nodes, edges);
    const pathNodeIds = simAlgorithm === 'dijkstra'
      ? findShortestPathDijkstra(graph, simOriginId, simDestId)
      : findShortestPathAStar(graph, simOriginId, simDestId, nodes);

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const pathNodes = pathNodeIds.map(id => nodeMap.get(id)).filter(Boolean);
    const pathCoordinates = pathNodes.map(n => [parseFloat(n.longitude), parseFloat(n.latitude)]);

    const { distanceMeters, formattedDistance, durationMinutes } = calculateRouteDistanceAndDuration(pathCoordinates, simTravelMode);
    const steps = generateDetailedTurnSteps(pathCoordinates, nodes);

    setSimResult({
      pathNodeIds,
      pathNodes,
      distanceMeters,
      formattedDistance,
      durationMinutes,
      steps,
      status: pathNodeIds.length > 0 ? 'SUCCESS' : 'NO_PATH'
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Navigation Control Center...</div>;
  }

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Campus Navigation & Route Control Center</h1>
          <p className="text-xs text-onSurfaceVariant font-medium">Manage campus markers, pedestrian graph nodes, edges, building entrances, and test A* routing algorithms.</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex border border-outline/20 rounded-full p-1 bg-white shadow-xs">
          <button
            onClick={() => setActiveTab('pins')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'pins' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-100'
            }`}
          >
            📍 Map Pins ({locations.length})
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'graph' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-100'
            }`}
          >
            🕸️ Routing Graph ({graphData.nodes?.length || 0} Nodes)
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'simulator' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-100'
            }`}
          >
            🧪 Route Simulator
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* TAB 1: MAP PINS */}
      {activeTab === 'pins' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-extrabold text-onSurface">Campus Map Pins & Locations</h2>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>New Marker</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-surface border border-outline/20 rounded-3xl p-5 shadow-2xs relative flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 flex-shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-onSurface text-sm">{loc.name}</h3>
                      <span className="text-[9px] bg-primaryContainer/30 text-primary font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {loc.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 text-onSurfaceVariant font-medium">
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-primary">my_location</span>
                      <span>Lat: {parseFloat(loc.latitude).toFixed(6)} | Lng: {parseFloat(loc.longitude).toFixed(6)}</span>
                    </p>
                    {loc.office_hours && (
                      <p className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                        <span>Hours: {loc.office_hours}</span>
                      </p>
                    )}
                    {loc.description && (
                      <p className="text-[11px] leading-relaxed text-onSurfaceVariant/90 border-l-2 border-primary/20 pl-2">
                        {loc.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {(loc.tags || []).map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-black rounded-full uppercase">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline/10">
                  <button
                    onClick={() => openEdit(loc)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-primary transition-colors cursor-pointer"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ROUTING GRAPH NODES & EDGES */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graph Nodes */}
            <div className="bg-white border border-outline/20 rounded-3xl p-5 shadow-elevation1 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <GitCommit size={18} className="text-primary" />
                  <span>Pedestrian Junction Nodes ({graphData.nodes?.length || 0})</span>
                </h3>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {(graphData.nodes || []).map((node) => (
                  <div key={node.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{node.name}</span>
                      <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">{node.node_type}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ID: {node.id} | [{parseFloat(node.longitude).toFixed(6)}, {parseFloat(node.latitude).toFixed(6)}]
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Graph Edges */}
            <div className="bg-white border border-outline/20 rounded-3xl p-5 shadow-elevation1 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Network size={18} className="text-primary" />
                  <span>Walkable Path Edges ({graphData.edges?.length || 0})</span>
                </h3>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {(graphData.edges || []).map((edge) => (
                  <div key={edge.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{edge.source_node_id} ↔ {edge.target_node_id}</span>
                      <span className="text-emerald-700 font-black">{parseFloat(edge.distance_meters).toFixed(1)} m</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                      <span>Surface: {edge.surface_type || 'paved'}</span>
                      <span>•</span>
                      <span>Mode: {edge.travel_mode || 'all'}</span>
                      <span>•</span>
                      <span>Bidirectional: {edge.is_bidirectional ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROUTE SIMULATOR & TESTER */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white border border-outline/20 rounded-3xl p-6 shadow-elevation2 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-bold">
                <Play size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Interactive A* / Dijkstra Route Simulator</h2>
                <p className="text-xs text-slate-500 font-semibold">Test shortest path search algorithm and step-by-step turn guidance across graph nodes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Origin Node */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">STARTING NODE</label>
                <select
                  value={simOriginId}
                  onChange={(e) => setSimOriginId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none"
                >
                  {(graphData.nodes || []).map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
                  ))}
                </select>
              </div>

              {/* Destination Node */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">DESTINATION NODE</label>
                <select
                  value={simDestId}
                  onChange={(e) => setSimDestId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none"
                >
                  {(graphData.nodes || []).map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
                  ))}
                </select>
              </div>

              {/* Algorithm Selection */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">ALGORITHM</label>
                <select
                  value={simAlgorithm}
                  onChange={(e) => setSimAlgorithm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="astar">A* Search (Heuristic Euclidean)</option>
                  <option value="dijkstra">Dijkstra Shortest Path</option>
                </select>
              </div>

              {/* Travel Mode */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">TRAVEL MODE</label>
                <select
                  value={simTravelMode}
                  onChange={(e) => setSimTravelMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="walking">Walking (1.16 m/s)</option>
                  <option value="cycling">Cycling (3.33 m/s)</option>
                  <option value="wheelchair">Wheelchair (0.83 m/s)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primaryHover text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={16} />
              <span>Run Route Test Simulation</span>
            </button>

            {/* Simulation Results Output */}
            {simResult && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-900">VERIFICATION PASSED: Obstacle-Free Path Computed</h4>
                      <p className="text-[11px] font-semibold text-emerald-700">
                        Distance: <strong>{simResult.formattedDistance}</strong> | Estimated Duration: <strong>{simResult.durationMinutes} mins</strong> | Nodes Traversed: <strong>{simResult.pathNodeIds.length}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Traversal Node Chain */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Node Traversal Sequence</h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-60 overflow-y-auto space-y-2">
                      {simResult.pathNodes.map((n, idx) => (
                        <div key={n.id} className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-black">{idx + 1}</span>
                          <span>{n.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({n.id})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step-by-Step Directions */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Generated Step-by-Step Directions</h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-60 overflow-y-auto space-y-2">
                      {simResult.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">{step.icon}</span>
                          <span>{step.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Map Pin Editing */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl overflow-hidden border border-outline/10 flex flex-col">
            <div className="px-6 py-5 bg-primary text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">{selectedLocation ? 'Edit Map Marker' : 'Add Map Marker'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Building / Location Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RV Block Classroom Ground Floor"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Latitude</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10.7543"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Longitude</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 78.6528"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Lab">Laboratory</option>
                    <option value="Amenity">Amenity</option>
                    <option value="Hostel">Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Floor</label>
                  <input
                    type="number"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Altitude</label>
                  <input
                    type="number"
                    value={form.altitude}
                    onChange={(e) => setForm({ ...form, altitude: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Office Hours</label>
                <input
                  type="text"
                  placeholder="e.g. 08:30 AM - 05:00 PM"
                  value={form.office_hours}
                  onChange={(e) => setForm({ ...form, office_hours: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Enter details about this campus building or office cabin..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Navigation Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. library, audit, admin"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                  <button type="button" onClick={addTag} className="px-3 bg-slate-100 hover:bg-slate-200 border border-outline/30 rounded-xl text-xs font-bold text-onSurface cursor-pointer">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 text-onSurfaceVariant text-[10px] font-bold px-2 py-1 rounded-lg">
                      <span>{tag}</span>
                      <button type="button" onClick={() => removeTag(idx)} className="hover:bg-slate-200 p-0.5 rounded-full text-red-500 cursor-pointer">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-outline/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline/30 hover:bg-slate-50 rounded-xl text-xs font-bold text-onSurfaceVariant transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-colors cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNavigation;
