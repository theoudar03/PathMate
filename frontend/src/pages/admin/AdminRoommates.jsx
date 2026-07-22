import React, { useState, useEffect } from 'react';
import { Home, Plus, Trash2, Edit, X, Mail, Phone, ShieldCheck, UserCheck } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminRoommates = () => {
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    gender: 'Male',
    department: 'Computer Science & Engineering',
    year: '1st Year',
    hostel_block: 'Boys Hostel',
    preferred_language: 'English',
    sleep_schedule: '10 PM - 6 AM',
    interests: 'Coding, Gaming, Badminton',
    contact_email: '',
    phone: '',
    is_visible: true
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRoommates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson('/api/admin/roommates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && Array.isArray(res.data)) {
        setRoommates(res.data);
      } else {
        setRoommates([]);
      }
    } catch (err) {
      console.error("Error fetching roommates:", err);
      setRoommates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoommates();
  }, []);

  const openAddModal = () => {
    setSelectedItem(null);
    setForm({
      name: '',
      gender: 'Male',
      department: 'Computer Science & Engineering',
      year: '1st Year',
      hostel_block: 'Boys Hostel',
      preferred_language: 'English',
      sleep_schedule: '10 PM - 6 AM',
      interests: 'Coding, Gaming, Badminton',
      contact_email: '',
      phone: '',
      is_visible: true
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (rm) => {
    setSelectedItem(rm);
    const interestsStr = Array.isArray(rm.interests)
      ? rm.interests.join(', ')
      : (typeof rm.interests === 'string' ? JSON.parse(rm.interests || '[]').join(', ') : '');

    setForm({
      name: rm.name || '',
      gender: rm.gender || 'Male',
      department: rm.department || 'Computer Science & Engineering',
      year: rm.year || '1st Year',
      hostel_block: rm.hostel_block || 'Boys Hostel',
      preferred_language: rm.preferred_language || 'English',
      sleep_schedule: rm.sleep_schedule || '10 PM - 6 AM',
      interests: interestsStr,
      contact_email: rm.contact_email || '',
      phone: rm.phone || '',
      is_visible: rm.is_visible ?? true
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const method = selectedItem ? 'PUT' : 'POST';
      const url = selectedItem ? `/api/admin/roommates/${selectedItem.id}` : '/api/admin/roommates';

      const payload = {
        ...form,
        interests: typeof form.interests === 'string' ? form.interests.split(',').map(s => s.trim()).filter(Boolean) : form.interests
      };

      const res = await safeFetchJson(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'Unable to save roommate profile.');
        return;
      }

      setShowModal(false);
      setSelectedItem(null);
      fetchRoommates();
    } catch (err) {
      setErrorMsg('An unexpected error occurred while saving roommate profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/roommates/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedItem(null);
        fetchRoommates();
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
            <Home className="text-primary" size={24} />
            Roommate Matcher Directory
          </h1>
          <p className="text-xs text-onSurfaceVariant mt-1">
            Manage live hostel roommate opt-ins in PostgreSQL. Any changes reflect instantly in the Student UI.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          Add Roommate Profile
        </button>
      </div>

      {/* Roommates Table */}
      <div className="bg-white border border-surfaceVariant rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-onSurfaceVariant font-semibold">Loading roommate profiles from PostgreSQL...</div>
        ) : roommates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surfaceContainerLow border-b border-surfaceVariant text-onSurfaceVariant font-bold uppercase tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4">Department & Year</th>
                  <th className="p-4">Hostel Block</th>
                  <th className="p-4">Habits & Food</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceVariant/60">
                {roommates.map((rm) => (
                  <tr key={rm.id} className="hover:bg-surfaceContainer/40 transition-colors">
                    <td className="p-4 font-bold text-onSurface">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {rm.name ? rm.name.charAt(0) : 'R'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-onSurface">{rm.name}</p>
                          <span className="text-[10px] text-onSurfaceVariant font-mono">{rm.student_id || 'SCE-RMM'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-onSurface">{rm.department}</p>
                      <p className="text-[10px] text-onSurfaceVariant">{rm.year || '1st Year'}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-full text-[10px] inline-block">
                        {rm.hostel_block}
                      </span>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <p className="text-onSurface font-medium">💤 {rm.sleep_schedule || '10 PM - 6 AM'}</p>
                      <p className="text-onSurfaceVariant">🥗 {rm.food_preference || 'Vegetarian'}</p>
                    </td>
                    <td className="p-4 text-onSurfaceVariant">
                      {rm.contact_email ? (
                        <span className="flex items-center gap-1"><Mail size={12} /> {rm.contact_email}</span>
                      ) : (
                        <span className="italic text-[10px]">No email</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(rm)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primaryContainer/50 transition-colors cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedItem(rm); setShowDeleteModal(true); }}
                          className="p-1.5 rounded-lg text-error hover:bg-errorContainer/50 transition-colors cursor-pointer"
                          title="Delete Profile"
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
            No roommate profiles found in database. Click "Add Roommate Profile" to register students.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-surfaceVariant rounded-3xl p-6 w-full max-w-lg shadow-elevation3 space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center border-b border-surfaceVariant pb-3">
              <h3 className="text-lg font-bold text-onSurface">
                {selectedItem ? 'Edit Roommate Profile' : 'Add Roommate Profile'}
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
                <label className="block font-bold text-onSurface mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Anand Kumar"
                  className="w-full p-2.5 border border-outline rounded-xl bg-surface focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-onSurface mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full p-2.5 border border-outline rounded-xl bg-surface"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-onSurface mb-1">Year of Study</label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full p-2.5 border border-outline rounded-xl bg-surface"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-onSurface mb-1">Department *</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full p-2.5 border border-outline rounded-xl bg-surface"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electrical & Electronics">Electrical & Electronics</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-onSurface mb-1">Hostel *</label>
                <select
                  value={form.hostel_block}
                  onChange={(e) => setForm({ ...form, hostel_block: e.target.value })}
                  className="w-full p-2.5 border border-outline rounded-xl bg-surface"
                >
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls Hostel">Girls Hostel</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-onSurface mb-1">Sleep Schedule</label>
                <input
                  type="text"
                  value={form.sleep_schedule}
                  onChange={(e) => setForm({ ...form, sleep_schedule: e.target.value })}
                  placeholder="10 PM - 6 AM"
                  className="w-full p-2.5 border border-outline rounded-xl bg-surface"
                />
              </div>

              <div>
                <label className="block font-bold text-onSurface mb-1">Interests & Hobbies (Comma Separated)</label>
                <input
                  type="text"
                  value={form.interests}
                  onChange={(e) => setForm({ ...form, interests: e.target.value })}
                  placeholder="Coding, Gaming, Badminton, Photography"
                  className="w-full p-2.5 border border-outline rounded-xl bg-surface"
                />
              </div>

              <div>
                <label className="block font-bold text-onSurface mb-1">Contact Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="student@saranathan.ac.in"
                  className="w-full p-2.5 border border-outline rounded-xl bg-surface"
                />
              </div>

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
                  {actionLoading ? 'Saving...' : 'Save Profile'}
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
            <h3 className="text-base font-bold text-onSurface">Delete Roommate Profile?</h3>
            <p className="text-xs text-onSurfaceVariant">
              Are you sure you want to permanently delete <strong className="text-onSurface">{selectedItem.name}</strong> from the roommate matcher directory?
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
    </div>
  );
};

export default AdminRoommates;
