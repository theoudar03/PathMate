import React, { useState, useEffect } from 'react';
import { Bus, Plus, Trash2, Edit, X, Upload, Sun, Moon, Calendar, Eye, ShieldCheck, CheckCircle2, Archive } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminBusRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    session: 'morning',
    route_date: new Date().toISOString().split('T')[0],
    image_url: '',
    status: 'active',
    uploaded_by: 'College Administration'
  });

  const [imagePreview, setImagePreview] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson('/api/admin/bus-routes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && Array.isArray(res.data)) {
        setRoutes(res.data);
      } else {
        setRoutes([]);
      }
    } catch (err) {
      console.error("Error fetching bus routes:", err);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const openAddModal = () => {
    setSelectedItem(null);
    const today = new Date().toISOString().split('T')[0];
    setForm({
      title: `Bus Route Board - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      description: 'Official Saranathan College bus routes and destination timings.',
      session: 'morning',
      route_date: today,
      image_url: '',
      status: 'active',
      uploaded_by: 'College Administration'
    });
    setImagePreview('');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (route) => {
    setSelectedItem(route);
    setForm({
      title: route.title || '',
      description: route.description || '',
      session: route.session || 'morning',
      route_date: route.route_date ? route.route_date.split('T')[0] : new Date().toISOString().split('T')[0],
      image_url: route.image_url || '',
      status: route.status || 'active',
      uploaded_by: route.uploaded_by || 'College Administration'
    });
    setImagePreview(route.image_url || '');
    setErrorMsg('');
    setShowModal(true);
  };

  // Convert File upload to Base64 (High Resolution)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, image_url: reader.result }));
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image_url) {
      setErrorMsg('Please provide a title and upload/enter a high-resolution bus route image.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const method = selectedItem ? 'PUT' : 'POST';
      const url = selectedItem ? `/api/admin/bus-routes/${selectedItem.id}` : '/api/admin/bus-routes';

      const res = await safeFetchJson(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to save bus route publication.');
        return;
      }

      setShowModal(false);
      setSelectedItem(null);
      fetchRoutes();
    } catch (err) {
      setErrorMsg('An unexpected error occurred while saving the bus route image.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/bus-routes/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedItem(null);
        fetchRoutes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-surfaceVariant shadow-xs">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider block">Admin Management</span>
          <h1 className="text-2xl font-bold text-onSurface mt-1 flex items-center gap-2">
            <Bus className="text-primary" size={24} />
            Today's Bus Routes Management
          </h1>
          <p className="text-xs text-onSurfaceVariant mt-1">
            Publish official photographed bus route board images directly to the Student Dashboard. Original high-res quality is preserved.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          Publish New Bus Route Board
        </button>
      </div>

      {/* Routes Table */}
      <div className="bg-white border border-surfaceVariant rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-onSurfaceVariant font-semibold">Loading bus routes from PostgreSQL...</div>
        ) : routes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surfaceContainerLow border-b border-surfaceVariant text-onSurfaceVariant font-bold uppercase tracking-wider">
                  <th className="p-4">Route Image</th>
                  <th className="p-4">Title & Details</th>
                  <th className="p-4">Session</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceVariant/60">
                {routes.map((rt) => (
                  <tr key={rt.id} className="hover:bg-surfaceContainer/40 transition-colors">
                    <td className="p-4">
                      <div className="relative w-16 h-12 rounded-xl bg-surfaceContainer overflow-hidden border border-outline/30 group cursor-pointer" onClick={() => { setSelectedItem(rt); setShowPreviewModal(true); }}>
                        <img src={rt.image_url} alt={rt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye size={14} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-onSurface text-sm">{rt.title}</p>
                      <p className="text-[11px] text-onSurfaceVariant line-clamp-1">{rt.description || 'Official bus route notice'}</p>
                    </td>
                    <td className="p-4">
                      {rt.session === 'morning' ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                          <Sun size={12} /> Morning Route
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                          <Moon size={12} /> Evening Route
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-onSurfaceVariant">
                      {rt.route_date ? new Date(rt.route_date).toLocaleDateString() : 'Today'}
                    </td>
                    <td className="p-4">
                      {rt.status === 'active' ? (
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> Active (Live)
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                          <Archive size={12} /> Archived
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedItem(rt); setShowPreviewModal(true); }}
                          className="p-1.5 rounded-lg text-onSurfaceVariant hover:bg-surfaceVariant/60 transition-colors cursor-pointer"
                          title="View High-Res Image"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(rt)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primaryContainer/50 transition-colors cursor-pointer"
                          title="Edit Route Details"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedItem(rt); setShowDeleteModal(true); }}
                          className="p-1.5 rounded-lg text-error hover:bg-errorContainer/50 transition-colors cursor-pointer"
                          title="Delete Route"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-onSurfaceVariant">
            No bus route publications found in database. Click "Publish New Bus Route Board" to upload today's route.
          </div>
        )}
      </div>

      {/* Upload / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-surfaceVariant rounded-3xl p-6 w-full max-w-lg shadow-elevation3 space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center border-b border-surfaceVariant pb-3">
              <h3 className="text-lg font-bold text-onSurface">
                {selectedItem ? 'Edit Bus Route Publication' : 'Publish New Bus Route Board'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-onSurfaceVariant hover:text-onSurface cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-errorContainer text-onErrorContainer p-3 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-onSurface mb-1">Route Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Today's Morning Bus Routes - 26 July 2026"
                  className="w-full p-2.5 border border-outline rounded-xl bg-surface focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-onSurface mb-1">Route Session *</label>
                  <select
                    value={form.session}
                    onChange={(e) => setForm({ ...form, session: e.target.value })}
                    className="w-full p-2.5 border border-outline rounded-xl bg-surface font-semibold"
                  >
                    <option value="morning">Morning Session (Arrival)</option>
                    <option value="evening">Evening Session (Departure)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-onSurface mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full p-2.5 border border-outline rounded-xl bg-surface font-semibold"
                  >
                    <option value="active">Active (Live on Student Portal)</option>
                    <option value="archived">Archived (History)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-onSurface mb-1">Route Date</label>
                <input
                  type="date"
                  value={form.route_date}
                  onChange={(e) => setForm({ ...form, route_date: e.target.value })}
                  className="w-full p-2.5 border border-outline rounded-xl bg-surface"
                />
              </div>

              <div>
                <label className="block font-bold text-onSurface mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Additional notes for students regarding timings or route changes..."
                  className="w-full p-2.5 border border-outline rounded-xl bg-surface focus:border-primary outline-none"
                />
              </div>

              {/* Upload Image Section */}
              <div className="space-y-2">
                <label className="block font-bold text-onSurface">Upload Official Bus Route Photo *</label>
                <div className="border-2 border-dashed border-outline/50 hover:border-primary rounded-2xl p-4 text-center bg-surfaceContainerLow transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="text-primary" size={24} />
                    <p className="text-xs font-bold text-onSurface">Click to Browse or Drag & Drop Bus Route Board Image</p>
                    <p className="text-[10px] text-onSurfaceVariant">Supports High-Res PNG, JPG, JPEG (Original clarity preserved)</p>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="block font-semibold text-onSurfaceVariant text-[11px] mb-1">Or enter Supabase / Web Image URL directly:</label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => { setForm({ ...form, image_url: e.target.value }); setImagePreview(e.target.value); }}
                    placeholder="https://..."
                    className="w-full p-2 border border-outline rounded-xl bg-surface text-xs font-mono"
                  />
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="p-3 bg-surfaceContainerLow border border-surfaceVariant rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-onSurface block">Image Preview:</span>
                  <div className="max-h-48 overflow-hidden rounded-xl border border-outline/30 bg-black/5">
                    <img src={imagePreview} alt="Bus Route Preview" className="w-full h-full object-contain max-h-48" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-surfaceVariant">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full border border-outline font-bold text-onSurface hover:bg-surfaceVariant transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-primary hover:bg-primaryHover text-white px-5 py-2 rounded-full font-bold shadow-sm transition-all cursor-pointer"
                >
                  {actionLoading ? 'Publishing...' : 'Publish Bus Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-surfaceVariant rounded-3xl p-6 w-full max-w-sm shadow-elevation3 space-y-4 text-left">
            <h3 className="text-base font-bold text-onSurface">Delete Bus Route Record?</h3>
            <p className="text-xs text-onSurfaceVariant">
              Are you sure you want to permanently delete <strong className="text-onSurface">{selectedItem.title}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-full border border-outline text-xs font-bold hover:bg-surfaceVariant transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
                className="bg-error text-onError px-4 py-2 rounded-full text-xs font-bold hover:bg-error/90 transition-colors cursor-pointer"
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview High-Res Modal */}
      {showPreviewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-surfaceContainerLowest p-4 rounded-3xl max-w-4xl w-full space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-surfaceVariant pb-2">
              <h3 className="text-sm font-bold text-onSurface">{selectedItem.title}</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 rounded-full hover:bg-surfaceVariant text-onSurface">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-2xl bg-black flex justify-center p-2">
              <img src={selectedItem.image_url} alt={selectedItem.title} className="max-w-full h-auto object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBusRoutes;
