import React, { useState, useEffect } from 'react';
import { Database, FileText, Upload, RefreshCw, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const AdminKnowledge = () => {
  const [status, setStatus] = useState({ documents: 0, chunks: 0, faqs: 0 });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('pdf');

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch('/api/admin/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch status:", e);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch('/api/admin/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("Failed to fetch documents:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchDocuments();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    try {
      setUploading(true);
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle, type: newType })
      });
      if (res.ok) {
        setNewTitle('');
        await fetchDocuments();
        await fetchStatus();
      }
    } catch (e) {
      console.error("Failed to upload:", e);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchDocuments();
        await fetchStatus();
      }
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleReindex = async () => {
    try {
      setReindexing(true);
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch('/api/admin/reindex', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Re-indexing started successfully in the background.");
      }
    } catch (e) {
      console.error("Failed to reindex:", e);
    } finally {
      setTimeout(() => setReindexing(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight text-onSurface flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          Knowledge Management
        </h1>
        <p className="text-onSurfaceVariant mt-2">
          Manage the AI Assistant's ground-truth knowledge base.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline/30 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-onSurfaceVariant">Indexed Documents</p>
            <p className="text-3xl font-bold text-primary mt-1">{status.documents}</p>
          </div>
          <FileText className="w-10 h-10 text-primary/20" />
        </div>
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline/30 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-onSurfaceVariant">Vector Chunks</p>
            <p className="text-3xl font-bold text-secondary mt-1">{status.chunks}</p>
          </div>
          <Database className="w-10 h-10 text-secondary/20" />
        </div>
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline/30 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-onSurfaceVariant">Structured FAQs</p>
            <p className="text-3xl font-bold text-tertiary mt-1">{status.faqs}</p>
          </div>
          <CheckCircle className="w-10 h-10 text-tertiary/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline/30 sticky top-24">
            <h2 className="text-xl font-bold text-onSurface mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Knowledge
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Document Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Hostel Guidelines 2024"
                  className="w-full px-4 py-2.5 rounded-xl border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Document Type</label>
                <select 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline bg-surface focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="pdf">PDF Handbook</option>
                  <option value="circular">Circular</option>
                  <option value="notice">Notice</option>
                  <option value="webpage">Web Page</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-primary text-onPrimary font-bold hover:bg-primary/90 transition-colors"
              >
                {uploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {uploading ? 'Processing...' : 'Upload & Index'}
              </button>
            </form>

            <hr className="my-6 border-outline/30" />

            <h2 className="text-xl font-bold text-onSurface mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-secondary" />
              Maintenance
            </h2>
            <button 
              onClick={handleReindex}
              disabled={reindexing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-secondaryContainer text-onSecondaryContainer font-bold hover:bg-secondaryContainer/80 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${reindexing ? 'animate-spin' : ''}`} />
              {reindexing ? 'Re-indexing...' : 'Re-index Entire Database'}
            </button>
            <p className="text-xs text-onSurfaceVariant/70 mt-3 text-center">
              Forces the AI to rebuild vector embeddings for all existing documents.
            </p>
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline/30">
            <h2 className="text-xl font-bold text-onSurface mb-6">Indexed Documents</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-onSurfaceVariant/40 mb-3" />
                <p className="text-onSurfaceVariant font-medium">No documents indexed yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-outline/30 hover:bg-surfaceVariant/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-primaryContainer/30">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-onSurface">{doc.title}</h3>
                        <p className="text-sm text-onSurfaceVariant flex items-center gap-2 mt-1">
                          <span className="uppercase text-[10px] tracking-wider font-bold px-2 py-0.5 rounded bg-surfaceVariant text-onSurfaceVariant">
                            {doc.type}
                          </span>
                          <span>Indexed: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-full text-error hover:bg-error/10 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminKnowledge;
