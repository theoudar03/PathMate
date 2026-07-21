import React, { useState, useEffect } from 'react';
import { FileText, Plus, Clock, Eye, AlertCircle, Trash2, Upload, Image as ImageIcon, CheckCircle, X, Edit, Paperclip } from 'lucide-react';

const CATEGORY_OPTIONS = ['General', 'Academic', 'Events & Clubs', 'Exams', 'Emergency', 'Hostel'];
const TARGET_OPTIONS = ['All Students', 'Hostellers', 'Day Scholars', 'CSE Department', 'ECE Department', 'EEE Department', 'IT Department', 'AI&DS Department', 'Civil Department'];

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [target, setTarget] = useState('All Students');
  const [priority, setPriority] = useState('normal');
  const [author, setAuthor] = useState('SCE Administration');
  const [expiryDate, setExpiryDate] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchNotices = async () => {
    setLoading(true);
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

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target.result;
        setPendingFiles(prev => [
          ...prev,
          {
            name: file.name,
            original_name: file.name,
            mime_type: file.type || 'application/octet-stream',
            file_size: file.size,
            data_base64: base64,
            preview_url: file.type.startsWith('image/') ? base64 : null
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('General');
    setTarget('All Students');
    setPriority('normal');
    setAuthor('SCE Administration');
    setExpiryDate('');
    setPendingFiles([]);
    setSelectedNotice(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const method = selectedNotice ? 'PUT' : 'POST';
      const url = selectedNotice ? `/api/admin/notices/${selectedNotice.id}` : '/api/admin/notices';

      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        target,
        priority,
        urgent: priority === 'urgent',
        author: author.trim() || 'SCE Administration',
        expiry_date: expiryDate || null,
        attachments: pendingFiles
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save notice');

      setShowModal(false);
      resetForm();
      fetchNotices();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedNotice) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/notices/${selectedNotice.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete notice');

      setShowDeleteModal(false);
      setSelectedNotice(null);
      fetchNotices();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (notice) => {
    setSelectedNotice(notice);
    setTitle(notice.title || '');
    setContent(notice.content || '');
    setCategory(notice.category || 'General');
    setTarget(notice.target || 'All Students');
    setPriority(notice.priority || 'normal');
    setAuthor(notice.author || 'SCE Administration');
    setExpiryDate(notice.expiry_date ? new Date(notice.expiry_date).toISOString().slice(0, 10) : '');
    setPendingFiles(notice.attachments || []);
    setErrorMsg('');
    setShowModal(true);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Notice Board Management</h1>
          <p className="text-xs text-onSurfaceVariant font-medium mt-1">
            Publish official announcements, circulars, and attachments directly to Student Dashboard.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-primary hover:bg-primaryHover text-onPrimary font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Publish New Notice</span>
        </button>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant font-semibold">Loading Notices from PostgreSQL...</div>
        ) : notices.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant italic">No notices published. Click "Publish New Notice" to add one.</div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className={`bg-surface border rounded-3xl p-5 shadow-2xs space-y-3 flex flex-col justify-between ${notice.urgent || notice.priority === 'urgent' ? 'border-rose-300 bg-rose-50/20' : 'border-surfaceVariant/60'}`}>
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${notice.priority === 'urgent' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-primaryContainer text-onPrimaryContainer'}`}>
                      {notice.priority || 'normal'}
                    </span>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-surfaceVariant text-onSurfaceVariant uppercase">
                      {notice.category || 'General'}
                    </span>
                  </div>
                  <span className="text-[10px] text-onSurfaceVariant font-semibold">
                    {new Date(notice.publishedAt || notice.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-onSurface text-base leading-snug">{notice.title}</h3>
                <p className="text-xs text-onSurfaceVariant mt-2 line-clamp-3 leading-relaxed bg-surfaceContainerLow/50 p-3 rounded-xl border border-outline/10">
                  {notice.content}
                </p>

                {notice.attachments && notice.attachments.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary">
                    <Paperclip size={14} />
                    <span>{notice.attachments.length} Attachment(s) attached</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-outline/10 text-xs text-onSurfaceVariant">
                <span className="font-semibold">Target: {notice.target || 'All Students'}</span>
                
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditModal(notice)}
                    className="p-1.5 hover:bg-surfaceVariant text-onSurfaceVariant hover:text-primary rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => { setSelectedNotice(notice); setShowDeleteModal(true); }}
                    className="p-1.5 hover:bg-rose-100 text-onSurfaceVariant hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PUBLISH / EDIT NOTICE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-xl w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant"><X size={18} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1">{selectedNotice ? 'Edit Notice' : 'Publish Notice'}</h3>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-bold mb-3">{errorMsg}</p>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Notice Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Notice headline..." className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Target Audience</label>
                  <select value={target} onChange={e => setTarget(e.target.value)} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                    {TARGET_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Notice Content</label>
                <textarea required rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="Full notice body text..." className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>

              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Attachments (PDFs / Images)</label>
                <input type="file" multiple onChange={handleFileSelect} className="w-full p-2 border rounded-xl bg-surfaceContainerLow cursor-pointer" />
                {pendingFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pendingFiles.map((f, idx) => (
                      <span key={idx} className="bg-primaryContainer text-onPrimaryContainer px-2.5 py-1 rounded-xl font-bold text-[10px] flex items-center gap-1">
                        {f.name || f.file_name}
                        <button type="button" onClick={() => removePendingFile(idx)} className="hover:text-rose-600"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary text-onPrimary font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedNotice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-md w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <h3 className="text-xl font-black text-rose-700 mb-2">Delete Notice</h3>
            <p className="text-xs text-onSurfaceVariant leading-relaxed mb-6">
              Are you sure you want to delete notice <strong>{selectedNotice.title}</strong>?
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
              <button onClick={handleDeleteSubmit} disabled={actionLoading} className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl shadow-md">
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminNotices;
