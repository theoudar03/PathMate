import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, ShieldAlert, CheckCircle, Clock, Trash2, Edit, X, RefreshCw, ChevronRight, Award, MessageSquare } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminAIReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'pending', 'verified', 'resolved', 'rejected'
  const [deptFilter, setDeptFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Dialog & Detail view
  const [selectedReport, setSelectedReport] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Resolution Form
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [adminNotes, setAdminNotes] = useState('');
  const [correctedAnswer, setCorrectedAnswer] = useState('');

  // Department presets
  const departments = [
    'All',
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Information Technology',
    'Artificial Intelligence & Data Science',
    'Computer Science & Business Systems',
    'Mechanical Engineering',
    'Civil Engineering',
    'N/A'
  ];

  // Source presets
  const sources = [
    'All',
    'Official College Database',
    'Official Saranathan Website',
    'Official Anna University Information',
    'AI-generated Educational Response'
  ];

  // Severity presets
  const severities = ['All', 'Low', 'Medium', 'High'];

  const fetchReports = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('pm_admin_token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (deptFilter !== 'All') params.append('department', deptFilter);
      if (sourceFilter !== 'All') params.append('source', sourceFilter);
      if (severityFilter !== 'All') params.append('severity', severityFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await safeFetchJson(`/api/admin/ai-reports?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok && Array.isArray(res.data)) {
        setReports(res.data);
      } else {
        setReports([]);
        if (res.error) setErrorMsg(res.error);
      }
    } catch (err) {
      console.error("Error fetching AI reports:", err);
      setReports([]);
      setErrorMsg('Failed to load reports. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [search, statusFilter, deptFilter, sourceFilter, severityFilter, dateFilter]);

  const handleOpenResolve = (report) => {
    setSelectedReport(report);
    setResolutionStatus(report.resolution_status === 'pending' ? 'resolved' : report.resolution_status);
    setAdminNotes(report.admin_notes || '');
    setCorrectedAnswer(report.ai_answer || '');
    setErrorMsg('');
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/ai-reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resolution_status: resolutionStatus,
          admin_notes: adminNotes,
          correctedAnswer: resolutionStatus === 'resolved' ? correctedAnswer : undefined
        })
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to update report resolution.');
        return;
      }

      setShowResolveModal(false);
      fetchReports();
    } catch (err) {
      setErrorMsg('An unexpected error occurred while updating report.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper for status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'verified':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'rejected':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return <CheckCircle size={14} className="mr-1 inline" />;
      case 'verified':
        return <Award size={14} className="mr-1 inline" />;
      case 'rejected':
        return <X size={14} className="mr-1 inline" />;
      case 'pending':
      default:
        return <Clock size={14} className="mr-1 inline" />;
    }
  };

  // Helper for severity styling
  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200 font-extrabold';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'Low':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper header action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-surfaceVariant/30 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-onSurface tracking-tight">AI Reports Desk</h1>
          <p className="text-sm text-onSurfaceVariant/80 mt-1">Review student reported incorrect answers, edit corrections, and build college knowledge.</p>
        </div>
        <button 
          onClick={fetchReports}
          className="btn-premium-secondary p-2.5 rounded-xl border border-outline/10 text-onSurface hover:bg-surfaceVariant flex items-center gap-1.5 transition-colors"
          title="Refresh table"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="text-xs font-bold">Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surfaceVariant/30 pb-1 overflow-x-auto shrink-0">
        {['All', 'Pending', 'Verified', 'Resolved', 'Rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              statusFilter === tab
                ? 'border-primary text-primary bg-primaryContainer/15'
                : 'border-transparent text-onSurfaceVariant hover:text-onSurface'
            }`}
          >
            {tab} Reports
          </button>
        ))}
      </div>

      {/* Advanced Filters and Search row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4.5 rounded-[22px] border border-outline/10 shadow-sm text-left">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-onSurfaceVariant/60" />
          <input
            type="text"
            placeholder="Search questions, answers, reasons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2.5 rounded-xl bg-slate-50 border border-outline/15 text-xs text-onSurface focus:outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>

        {/* Date Filter */}
        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-outline/15 text-xs text-onSurface focus:outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
            title="Filter by Date"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-outline/15 text-xs text-onSurface font-medium focus:outline-none focus:border-primary focus:bg-white cursor-pointer"
          >
            <option value="All">All Departments</option>
            {departments.slice(1).map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-outline/15 text-xs text-onSurface font-medium focus:outline-none focus:border-primary focus:bg-white cursor-pointer"
          >
            <option value="All">All Sources</option>
            {sources.slice(1).map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table view */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold text-left">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="space-y-4 py-12 text-center">
          <div className="w-10 h-10 border-4 border-primary/25 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-onSurfaceVariant font-semibold">Loading reported answers desk...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-outline/10 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-50 border border-outline/10 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare size={20} />
          </div>
          <h3 className="font-extrabold text-sm text-onSurface">No reports found</h3>
          <p className="text-xs text-onSurfaceVariant max-w-xs mx-auto">
            There are no reported answers matching your selected filter parameters.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Stacked Card View (Visible on small screen sizes only) */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-2xl p-4 border border-outline/10 space-y-3 shadow-sm text-left">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${getSeverityBadgeClass(report.severity)}`}>
                    {report.severity} Severity
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] border font-bold uppercase select-none ${getStatusBadgeClass(report.resolution_status)}`}>
                    {report.resolution_status}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs font-bold text-onSurface">
                    <span className="text-primary font-black mr-1">Q:</span>
                    {report.question}
                  </div>
                  <div className="text-xs text-onSurfaceVariant/85 italic pl-3 border-l-2 border-slate-200 truncate">
                    "{(report.ai_answer || '').substring(0, 120)}{report.ai_answer?.length > 120 ? '...' : ''}"
                  </div>
                </div>

                <div className="pt-2.5 border-t border-outline/5 flex items-center justify-between text-[10px] text-onSurfaceVariant">
                  <div>
                    <strong className="text-onSurface">{report.reported_reason}</strong>
                    <div className="text-[9px] text-onSurfaceVariant/70 mt-0.5">{report.user_name || 'Anonymous'} ({report.user_department || 'N/A'})</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenResolve(report)}
                    className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary font-bold rounded-lg text-xs transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <Edit size={10} />
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden sm:block bg-white rounded-3xl border border-outline/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-outline/10 text-left text-xs">
                <thead className="bg-slate-50 font-bold text-onSurfaceVariant/85 border-b border-outline/10">
                  <tr>
                    <th className="px-5 py-3">Report Details</th>
                    <th className="px-5 py-3">Student Reason & Info</th>
                    <th className="px-5 py-3">Source Tag</th>
                    <th className="px-5 py-3">Severity</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10 bg-white">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 max-w-md">
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-onSurfaceVariant/70">Q:</span>
                            <span className="font-bold text-onSurface ml-1 break-words">{report.question}</span>
                          </div>
                          <div className="text-onSurfaceVariant/90 leading-relaxed text-[11px] max-w-xs truncate italic">
                            <span>A:</span> "{report.ai_answer}"
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-left">
                          <div className="font-semibold text-onSurface">{report.reported_reason}</div>
                          {report.student_comments && (
                            <div className="text-[10px] text-onSurfaceVariant max-w-xs truncate">"{report.student_comments}"</div>
                          )}
                          <div className="text-[9px] text-onSurfaceVariant/80 mt-1">
                            <strong>{report.user_name || 'Anonymous'}</strong> ({report.user_department || 'N/A'})
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-onSurface font-medium">
                        {report.source || 'Gemini'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-md text-[10px] border ${getSeverityBadgeClass(report.severity)}`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] border flex items-center w-fit font-bold uppercase select-none ${getStatusBadgeClass(report.resolution_status)}`}>
                          {getStatusIcon(report.resolution_status)}
                          {report.resolution_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleOpenResolve(report)}
                          className="btn-premium-secondary px-3 py-1.5 border border-outline/10 text-xs font-bold hover:bg-slate-100 rounded-lg text-primary transition-colors inline-flex items-center gap-1.5 active-press"
                        >
                          <Edit size={12} />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Resolution Dialog Modal */}
      {showResolveModal && selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in text-left">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-elevation4 border border-outline/10 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-outline/10 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-primary w-5.5 h-5.5 shrink-0" />
                <h3 className="font-extrabold text-sm text-onSurface">Review & Correct AI Answer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="text-onSurfaceVariant/70 hover:text-onSurface p-1.5 rounded-full hover:bg-slate-200/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleResolveSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Student Report Preview Card */}
              <div className="bg-slate-50 border border-outline/10 rounded-2xl p-4.5 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-[11px] border-b border-outline/5 pb-2.5 text-left">
                  <div>
                    <span className="font-bold text-onSurfaceVariant/70 uppercase text-[9px] block">Reported By</span>
                    <span className="font-bold text-onSurface">{selectedReport.user_name || 'Anonymous Student'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-onSurfaceVariant/70 uppercase text-[9px] block">Department</span>
                    <span className="font-semibold text-onSurface">{selectedReport.user_department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-onSurfaceVariant/70 uppercase text-[9px] block">Source Used</span>
                    <span className="font-semibold text-onSurface">{selectedReport.source}</span>
                  </div>
                  <div>
                    <span className="font-bold text-onSurfaceVariant/70 uppercase text-[9px] block">Report Date</span>
                    <span className="font-semibold text-onSurface">{new Date(selectedReport.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-xs text-left">
                  <span className="font-bold text-onSurfaceVariant/70 uppercase text-[9px] block">Student Question</span>
                  <p className="font-bold text-onSurface mt-0.5">{selectedReport.question}</p>
                </div>

                <div className="text-xs text-left">
                  <span className="font-bold text-onSurfaceVariant/70 uppercase text-[9px] block">Reported Reason & Comments</span>
                  <p className="font-semibold text-onSurface">{selectedReport.reported_reason}</p>
                  {selectedReport.student_comments && (
                    <p className="text-onSurfaceVariant mt-1 bg-white border border-outline/5 rounded-lg p-2 italic">
                      "{selectedReport.student_comments}"
                    </p>
                  )}
                </div>
              </div>

              {/* Status and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-onSurfaceVariant">Resolution Status</label>
                  <select
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-outline/20 rounded-xl px-3 py-2.5 text-xs font-semibold text-onSurface focus:outline-none focus:border-primary focus:bg-white"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="verified">Verified (Flagged)</option>
                    <option value="resolved">Resolved (Correct Answer)</option>
                    <option value="rejected">Rejected (No Error)</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-onSurfaceVariant">Admin Notes (Private)</label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Valid error, HOD name updated in FAQs."
                    className="w-full bg-slate-50 border border-outline/20 rounded-xl px-3 py-2.5 text-xs text-onSurface focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>
              </div>

              {/* Corrected Answer Box */}
              {resolutionStatus === 'resolved' && (
                <div className="space-y-2 border-t border-outline/10 pt-3 text-left animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-onSurfaceVariant">
                      Correct Official Answer <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Syncs to approval FAQs index
                    </span>
                  </div>
                  <textarea
                    rows="3.5"
                    value={correctedAnswer}
                    onChange={(e) => setCorrectedAnswer(e.target.value)}
                    placeholder="Provide the verified ground-truth answer..."
                    className="w-full bg-slate-50 border border-outline/20 rounded-xl px-3.5 py-2.5 text-xs text-onSurface focus:outline-none focus:border-primary focus:bg-white resize-none"
                    required
                  ></textarea>
                  <p className="text-[10px] text-onSurfaceVariant/80 leading-normal">
                    💡 <strong>Continuous Improvement:</strong> Submitting this correction automatically inserts or updates this question in the approves FAQ database index. Future matches by students will instantly bypass classification layers and return this correction!
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-3.5 border-t border-outline/10 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 text-xs font-bold text-onSurfaceVariant hover:bg-slate-100 rounded-xl active-press transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-[#123669] rounded-xl shadow-sm active-press transition-all flex items-center gap-1.5"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[14px]">save</span>
                      <span>Save Resolution</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAIReports;
