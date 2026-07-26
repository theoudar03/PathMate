import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit, Save, Check, X, ShieldAlert } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminNavigation = () => {
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
    category: 'Academic', // 'Academic' | 'Administrative' | 'Lab' | 'Amenity' | 'Hostel'
    description: '',
    office_hours: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch('/api/admin/navigation/locations', { headers });
      if (res.ok) setLocations(await res.json());
    } catch (err) {
      console.error(err);
      setError('Failed to fetch map pins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setSelectedLocation(null);
    setForm({
      name: '',
      latitude: '10.7275', // default college lat
      longitude: '78.6562', // default college lng
      altitude: 0,
      floor: 0,
      category: 'Academic',
      description: '',
      office_hours: '09:00 AM - 04:30 PM',
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

    // Coordinates Validation
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

  if (loading) {
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Navigation markers...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Campus Navigation Pins</h1>
          <p className="text-xs text-onSurfaceVariant font-medium">Control panel to coordinate map coordinates, floor locations, and descriptions.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>New Marker</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

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
                  {loc.tags.map((t, idx) => (
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
                    placeholder="e.g. 10.7275"
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
                    placeholder="e.g. 78.6562"
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
                  placeholder="e.g. 09:00 AM - 04:30 PM"
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
