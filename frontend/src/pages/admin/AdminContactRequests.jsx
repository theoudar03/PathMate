import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, AlertCircle, XCircle, Search, Filter, RefreshCw, MessageSquare, Save } from 'lucide-react';

const AdminContactRequests = () => {
  const adminToken = localStorage.getItem('pm_admin_token');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedReq, setSelectedReq] = useState(null);
  const [newStatus, setNewStatus] = useState('New');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contact-requests', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch contact requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenModal = (req) => {
    setSelectedReq(req);
    setNewStatus(req.status || 'New');
    setAdminNotes(req.admin_notes || '');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/contact-requests/${selectedReq.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update request status.');

      setRequests(prev => prev.map(r => r.id === selectedReq.id ? data : r));
      setSelectedReq(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filtered = requests.filter(r => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      r.name?.toLowerCase().includes(q) || 
      r.email?.toLowerCase().includes(q) || 
      r.category?.toLowerCase().includes(q) || 
      r.message?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in p-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Mail className="text-primary" size={26} />
            Contact Requests Moderation
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Review and resolve student inquiries, campus map reports, and support requests.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-full transition-all cursor-pointer"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, category, or message..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests Table / Cards */}
      {loading ? (
        <div className="bg-white p-8 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-bold animate-pulse">
          Loading contact requests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 border border-slate-200 rounded-2xl text-center space-y-2">
          <MessageSquare size={32} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No Contact Requests Found</h3>
          <p className="text-xs text-slate-400">There are no student inquiries matching your search criteria.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Sender</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Message Snippet</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-500">#{req.id}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-slate-800">{req.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{req.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-[10.5px]">
                        {req.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-medium">
                      {req.message}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full ${
                        req.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        req.status === 'In Review' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        req.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenModal(req)}
                        className="bg-primary hover:bg-primaryHover text-white font-bold text-[11px] py-1.5 px-3 rounded-full shadow-xs cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-left space-y-4 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-wider">Contact Request #{selectedReq.id}</span>
                <h3 className="text-base font-extrabold text-slate-800">{selectedReq.category}</h3>
              </div>
              <button onClick={() => setSelectedReq(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs text-slate-700">
              <p><strong>From:</strong> {selectedReq.name} ({selectedReq.email})</p>
              <p><strong>Ref Page:</strong> {selectedReq.page_reference || 'N/A'}</p>
              <p><strong>Message:</strong></p>
              <p className="bg-white p-3 rounded-lg border border-slate-200 italic font-medium leading-relaxed">
                "{selectedReq.message}"
              </p>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800"
                >
                  <option value="New">New</option>
                  <option value="In Review">In Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Admin Resolution Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Record internal resolution details or response sent..."
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-primary hover:bg-primaryHover text-white font-extrabold text-xs py-2 px-5 rounded-full shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} />
                  <span>{updating ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactRequests;
