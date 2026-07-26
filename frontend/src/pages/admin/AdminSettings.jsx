import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, CheckCircle2 } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [setRes, logsRes] = await Promise.all([
        fetch('/api/admin/settings', { headers }),
        fetch('/api/admin/settings/logs', { headers })
      ]);

      if (setRes.ok) {
        const data = await setRes.json();
        // Convert array of {key, value} to key-value object
        const obj = {};
        data.forEach(item => {
          obj[item.key] = item.value;
        });
        setSettings(obj);
      }
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (err) {
      console.error(err);
      setError('Failed to fetch settings config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    const token = localStorage.getItem('pm_admin_token');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      });
      if (res.ok) {
        setSuccess('System configuration settings updated successfully. Logs written to audit record.');
        fetchData();
      } else {
        const body = await res.json();
        setError(body.error || 'Failed to save system settings');
      }
    } catch (err) {
      setError('Network error saving config settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading System Configuration...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-onSurface tracking-tight">System Settings</h1>
        <p className="text-xs text-onSurfaceVariant font-medium">Control panel to coordinate global campus settings, support hotlines, and audit history logs.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="lg:col-span-2 bg-surface border border-outline/20 rounded-3xl p-6 shadow-2xs space-y-4">
          <h2 className="text-xs font-black uppercase text-onSurfaceVariant mb-2 flex items-center gap-1.5">
            <Settings size={15} />
            <span>Global Key-Value Configurations</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">College Support Phone Hotline</label>
              <input
                type="text"
                value={settings.support_phone || ''}
                onChange={(e) => handleChange('support_phone', e.target.value)}
                placeholder="e.g. +91 431 290 8400"
                className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Emergency Helpdesk Email</label>
              <input
                type="email"
                value={settings.support_email || ''}
                onChange={(e) => handleChange('support_email', e.target.value)}
                placeholder="e.g. support@saranathan.ac.in"
                className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">College Website Home Address</label>
              <input
                type="text"
                value={settings.college_website || ''}
                onChange={(e) => handleChange('college_website', e.target.value)}
                placeholder="e.g. https://saranathan.ac.in"
                className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">AI Chatbot Welcome Prompt message</label>
              <textarea
                rows={3}
                value={settings.bot_welcome_msg || ''}
                onChange={(e) => handleChange('bot_welcome_msg', e.target.value)}
                placeholder="Welcome to Saranathan College Knowledge System! How can I assist you with regulations or maps today?"
                className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline/10 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-colors cursor-pointer"
            >
              <Save size={15} />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>

        {/* Audit Log column */}
        <div className="lg:col-span-1 bg-surface border border-outline/25 rounded-3xl p-6 shadow-2xs">
          <h2 className="text-xs font-black uppercase text-onSurfaceVariant mb-3">Admin Activity Audit Logs</h2>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div key={log.id} className="text-xs border-b border-outline/10 pb-2.5 space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-extrabold text-primary uppercase">{log.action_type.replace('_', ' ')}</span>
                  <span className="text-slate-400 font-medium">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-onSurfaceVariant leading-snug">{log.description}</p>
                <p className="text-[9px] text-slate-400 font-bold">Admin ID: {log.admin_id}</p>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center text-xs text-onSurfaceVariant/60 py-12 italic">No activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
