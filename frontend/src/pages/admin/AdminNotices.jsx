import React, { useState, useEffect } from 'react';
import { FileText, Plus, MoreVertical, Clock, Eye, AlertCircle, Trash2 } from 'lucide-react';

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const token = localStorage.getItem('pm_admin_token');
        const res = await fetch('/api/admin/notices', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setNotices(await res.json());
      } catch (err) {
        console.error("Error fetching notices:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this notice?`)) return;
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotices(notices.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error(`Error deleting notice:`, err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/notices`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, urgent: data.urgent === 'on' })
      });
      
      if (res.ok) {
        const newNotice = await res.json();
        setNotices([newNotice, ...notices]);
        setShowModal(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to publish notice');
      }
    } catch (err) {
      console.error(`Error publishing notice:`, err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-onSurface">Notice Board</h1>
          <p className="text-onSurfaceVariant text-sm">Publish and manage digital campus announcements</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-onPrimary px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Publish Notice
        </button>
      </div>

      <div className="bg-surface border border-surfaceVariant rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surfaceVariant/30 text-onSurfaceVariant border-b border-surfaceVariant/50">
              <tr>
                <th className="px-6 py-4 font-medium">Notice Title</th>
                <th className="px-6 py-4 font-medium">Target Audience</th>
                <th className="px-6 py-4 font-medium">Published</th>
                <th className="px-6 py-4 font-medium">Views</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surfaceVariant/50">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-onSurfaceVariant">Loading...</td></tr>
              ) : notices.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-onSurfaceVariant">No notices found.</td></tr>
              ) : notices.map((notice) => (
                <tr key={notice.id} className="hover:bg-surfaceVariant/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {notice.urgent && <AlertCircle size={16} className="text-error" />}
                      <p className={`font-semibold transition-colors ${notice.urgent ? 'text-error' : 'text-onSurface group-hover:text-primary'}`}>
                        {notice.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-surfaceVariant/50 px-2.5 py-1 rounded-md text-onSurface text-xs font-semibold">
                      {notice.target}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-onSurface flex items-center gap-1"><Clock size={14} className="text-onSurfaceVariant"/> {new Date(notice.publishedAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-onSurface flex items-center gap-1"><Eye size={14} className="text-onSurfaceVariant"/> {notice.views}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(notice.id)} className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surfaceVariant border border-surfaceVariant/50 rounded-3xl p-6 w-full max-w-md shadow-elevation3">
            <h2 className="text-xl font-bold text-onSurface mb-4">Publish Notice</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Notice Title</label>
                <input name="title" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 text-onSurface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Content</label>
                <textarea name="content" required rows="3" className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 text-onSurface focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Target Audience</label>
                <select name="target" className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 text-onSurface focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="All Students">All Students</option>
                  <option value="Hostellers">Hostellers</option>
                  <option value="Day Scholars">Day Scholars</option>
                  <option value="CSE Department">CSE Department</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" name="urgent" id="urgent" className="rounded text-primary focus:ring-primary" />
                <label htmlFor="urgent" className="text-sm font-medium text-error">Mark as Urgent (High Priority)</label>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-onSurfaceVariant font-medium hover:bg-surfaceVariant/50 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-onPrimary font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotices;
