import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Check, X, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminWebSync = () => {
  const [logs, setLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch('/api/admin/web-sync/logs', { headers });
      if (res.ok) setLogs(await res.json());
    } catch (err) {
      console.error(err);
      setError('Failed to load website sync log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch('/api/admin/web-sync/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Scraper simulation completed successfully. New sync log created.');
        fetchData();
      } else {
        const body = await res.json();
        setError(body.error || 'Scraper encountered errors');
      }
    } catch (err) {
      setError('Network error executing sync scraper');
    } finally {
      setSyncing(false);
    }
  };

  const handleApprove = async (id) => {
    setError('');
    setSuccess('');
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/web-sync/approve/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Changes approved. Syllabi, fee structures, and admissions data synchronized in database.');
        fetchData();
      } else {
        const body = await res.json();
        setError(body.error || 'Failed to approve changes');
      }
    } catch (err) {
      setError('Network error approving changes');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to dismiss and reject these scraped updates?')) return;
    setError('');
    setSuccess('');
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/web-sync/reject/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Changes rejected and dismissed.');
        fetchData();
      } else {
        const body = await res.json();
        setError(body.error || 'Failed to reject changes');
      }
    } catch (err) {
      setError('Network error rejecting changes');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Web Scraper Sync Center...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Website Sync Manager</h1>
          <p className="text-xs text-onSurfaceVariant font-medium">Scrape college website for updates on syllabus, regulations, and announcements.</p>
        </div>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className={`flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${syncing ? 'animate-pulse' : ''}`}
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          <span>{syncing ? 'Scraping Site...' : 'Trigger Live Sync'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-4 rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-surface border border-outline/25 rounded-3xl p-5 shadow-2xs">
        <h2 className="text-xs font-black uppercase text-onSurfaceVariant mb-3">Sync Logs & Scraper Approval Queue</h2>
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="border border-outline/15 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between md:flex-row gap-4 items-start md:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-onSurface">Sync Run #{log.id}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    log.status === 'pending_approval' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    log.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {log.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-onSurfaceVariant/85 font-semibold">
                  Source: <a href={log.scraped_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{log.scraped_url}</a>
                </p>
                <p className="text-[10px] text-onSurfaceVariant/70">
                  Scraped: {new Date(log.scraped_at).toLocaleString()}
                </p>
                {log.extracted_changes && (
                  <pre className="bg-white p-3 rounded-xl border border-outline/10 text-[9px] font-mono text-onSurfaceVariant/80 max-h-[140px] overflow-y-auto max-w-full">
                    {JSON.stringify(log.extracted_changes, null, 2)}
                  </pre>
                )}
              </div>

              {log.status === 'pending_approval' && (
                <div className="flex gap-2 flex-shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => handleApprove(log.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Approve Sync</span>
                  </button>
                  <button
                    onClick={() => handleReject(log.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <X size={14} />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {logs.length === 0 && (
            <p className="text-center text-xs text-onSurfaceVariant/60 py-12 italic">No website sync tasks recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWebSync;
