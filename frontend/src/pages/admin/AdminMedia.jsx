import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Trash2, Copy, FileText, Image as ImageIcon, Link as LinkIcon, X } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminMedia = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [form, setForm] = useState({
    fileName: '',
    fileType: 'image/png',
    base64Data: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch('/api/admin/media', { headers });
      if (res.ok) setMedia(await res.json());
    } catch (err) {
      console.error(err);
      setError('Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm({
        fileName: file.name,
        fileType: file.type,
        base64Data: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const token = localStorage.getItem('pm_admin_token');

    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowModal(false);
        setSuccess('File uploaded successfully to media library.');
        fetchData();
      } else {
        const body = await res.json();
        setError(body.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error uploading file');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file from the media library?')) return;
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
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

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert('File URL copied to clipboard!');
  };

  if (loading) {
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Media Library...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Media Library</h1>
          <p className="text-xs text-onSurfaceVariant font-medium">Upload photos, floor plans, cafeteria flyers, and PDF guide books.</p>
        </div>
        <button
          onClick={() => {
            setForm({ fileName: '', fileType: 'image/png', base64Data: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>Upload File</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-4 rounded-xl border border-emerald-200">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {media.map((m) => {
          const isImage = m.file_type.startsWith('image/');
          return (
            <div key={m.id} className="bg-surface border border-outline/20 rounded-2xl overflow-hidden shadow-2xs relative flex flex-col justify-between group">
              <div className="aspect-square bg-slate-50 flex items-center justify-center border-b border-outline/10 relative overflow-hidden">
                {isImage ? (
                  <img src={m.file_url} alt={m.file_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                ) : (
                  <FileText size={32} className="text-slate-400" />
                )}
                
                <button
                  onClick={() => handleDelete(m.id)}
                  className="absolute right-2 top-2 p-1.5 bg-white/90 hover:bg-red-50 text-red-500 rounded-full shadow-sm hover:scale-105 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Delete File"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="p-3 space-y-1">
                <p className="font-extrabold text-onSurface text-[11px] truncate" title={m.file_name}>
                  {m.file_name}
                </p>
                <p className="text-[9px] text-onSurfaceVariant/80 font-bold uppercase tracking-wider">
                  {(m.file_size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={() => copyToClipboard(m.file_url)}
                  className="w-full mt-1.5 flex items-center justify-center gap-1 py-1 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                >
                  <Copy size={11} />
                  <span>Copy URL</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl overflow-hidden border border-outline/10 flex flex-col">
            <div className="px-6 py-5 bg-primary text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">Upload Media Asset</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Select File</label>
                <input
                  type="file"
                  required
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs font-semibold text-onSurfaceVariant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary file:cursor-pointer"
                />
              </div>

              {form.fileName && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-onSurface">File Selected: {form.fileName}</p>
                  {form.fileType.startsWith('image/') && (
                    <img src={form.base64Data} alt="Preview" className="max-h-[160px] object-contain rounded-xl border border-outline/10" />
                  )}
                </div>
              )}

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
                  Start Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMedia;
