import React, { useState, useEffect } from 'react';
import { 
  Star, Search, Filter, MessageSquare, AlertTriangle, ShieldCheck, 
  Trash2, Award, Pin, MoreVertical, Edit3, Send, Check, X, 
  ThumbsUp, Calendar, RefreshCw, BarChart2, Heart, ShieldAlert
} from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm flex items-start justify-between group hover:shadow-md transition-all">
    <div>
      <p className="text-onSurfaceVariant text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-black text-onSurface group-hover:scale-105 origin-left transition-transform">{value}</h3>
      {subtitle && (
        <p className="text-[11px] text-onSurfaceVariant/80 mt-1.5 font-medium">{subtitle}</p>
      )}
    </div>
    <div className={`p-3.5 rounded-2xl ${colorClass}`}>
      <Icon size={22} />
    </div>
  </div>
);

const CATEGORIES = [
  'Overall Experience',
  'AI Assistant',
  'Campus Navigation',
  'Study Hub',
  'Student Dashboard',
  'Events',
  'Clubs',
  'Senior Connect',
  'Bus Routes',
  'General Feedback'
];

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Computer Science & Business Systems',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Instrumentation & Control Engineering',
  'Civil Engineering',
  'Mechanical Engineering'
];

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('Pending'); // Pending | Approved | Rejected | Featured | Reported | All
  const [deptFilter, setDeptFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Action Dialog/Modal States
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminNotesText, setAdminNotesText] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [modifyingId, setModifyingId] = useState(null);

  const token = localStorage.getItem('pm_admin_token');

  const fetchReviews = async () => {
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        department: deptFilter,
        rating: ratingFilter,
        category: categoryFilter,
        search: searchQuery,
        date: dateFilter
      });

      const res = await safeFetchJson(`/api/admin/reviews?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && res.data) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await safeFetchJson('/api/admin/reviews/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error("Error fetching reviews analytics:", err);
    }
  };

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([fetchReviews(), fetchAnalytics()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, deptFilter, ratingFilter, categoryFilter, dateFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleAction = async (reviewId, updates) => {
    setModifyingId(reviewId);
    try {
      const res = await safeFetchJson(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        // Success
        await loadData();
      }
    } catch (err) {
      console.error("Failed to moderate review:", err);
    } finally {
      setModifyingId(null);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Permanently delete this review from the database? This action is irreversible.')) return;
    setModifyingId(reviewId);
    try {
      const res = await safeFetchJson(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setModifyingId(null);
    }
  };

  const handleOpenReplyModal = (review) => {
    setSelectedReview(review);
    setAdminReplyText(review.admin_reply || '');
    setAdminNotesText(review.admin_notes || '');
    setIsReplyModalOpen(true);
  };

  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!selectedReview) return;
    setIsReplyModalOpen(false);
    await handleAction(selectedReview.id, {
      admin_reply: adminReplyText,
      admin_notes: adminNotesText
    });
    setSelectedReview(null);
  };

  const handleOpenEditModal = (review) => {
    setSelectedReview(review);
    setEditRating(review.rating);
    setEditTitle(review.title);
    setEditDescription(review.description);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedReview) return;
    setIsEditModalOpen(false);
    await handleAction(selectedReview.id, {
      rating: editRating,
      title: editTitle,
      description: editDescription
    });
    setSelectedReview(null);
  };

  if (loading || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-xs text-onSurfaceVariant mt-3 font-semibold">Loading Feedback Telemetry...</p>
      </div>
    );
  }

  const { summary, distribution, categories, sentiment } = analytics;

  return (
    <div className="space-y-6 text-left pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-onSurface tracking-tight">Reviews & Rating Hub</h1>
            <span className="text-[10px] bg-primaryContainer text-onPrimaryContainer font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Moderation Panel
            </span>
          </div>
          <p className="text-xs text-onSurfaceVariant font-medium mt-1">
            Approve, edit, or reject student reviews, reply directly, and analyze dynamic sentiment.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-surfaceContainerHigh hover:bg-surfaceVariant text-onSurface rounded-xl text-xs font-bold border border-outline/30 transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Reviews" 
          value={summary.totalReviews} 
          icon={MessageSquare} 
          colorClass="bg-blue-50 text-blue-700"
          subtitle={`${summary.pending} pending moderation`}
        />
        <StatCard 
          title="Average Rating" 
          value={`⭐ ${summary.averageRating}`} 
          icon={Star} 
          colorClass="bg-amber-50 text-amber-700"
          subtitle="Based on approved reviews"
        />
        <StatCard 
          title="Reported Reviews" 
          value={summary.reported} 
          icon={ShieldAlert} 
          colorClass="bg-rose-50 text-rose-700"
          subtitle="Flagged by student users"
        />
        <StatCard 
          title="Positive Sentiment" 
          value={`${summary.totalReviews > 0 ? Math.round((sentiment.positive / (summary.approved || 1)) * 100) : 0}%`} 
          icon={Heart} 
          colorClass="bg-emerald-50 text-emerald-700"
          subtitle={`${sentiment.needsAttention} need attention`}
        />
      </div>

      {/* Sentiment & Ratings Distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ratings distribution */}
        <div className="bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-onSurfaceVariant flex items-center gap-1.5">
            <BarChart2 size={16} className="text-primary" />
            Rating Distribution
          </h3>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const totalApproved = summary.approved || 1;
              const pct = Math.round((count / totalApproved) * 100);
              return (
                <div key={stars} className="flex items-center gap-3 text-xs font-bold text-onSurface">
                  <span className="w-12 text-right">{stars} Star</span>
                  <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        stars >= 4 ? 'bg-amber-500' : stars === 3 ? 'bg-indigo-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-onSurfaceVariant">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories Ratings breakdown */}
        <div className="bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-onSurfaceVariant flex items-center gap-1.5">
            <Filter size={16} className="text-primary" />
            Feature Average Ratings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[160px] overflow-y-auto pr-1">
            {categories.length > 0 ? (
              categories.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/50">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-onSurface truncate">{c.category}</p>
                    <p className="text-[10px] text-onSurfaceVariant font-bold mt-0.5">{c.count} reviews</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-black px-2.5 py-1 rounded-xl border border-amber-200">
                    <Star size={12} className="fill-amber-600 text-amber-600" />
                    <span>{c.avgRating}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-onSurfaceVariant italic">No approved reviews categorized yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Moderation section */}
      <div className="bg-surface border border-surfaceVariant/60 rounded-[32px] p-6 shadow-sm space-y-6">
        
        {/* Section header tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surfaceVariant/50 pb-4">
          <div className="flex flex-wrap gap-2">
            {['Pending', 'Approved', 'Rejected', 'Featured', 'Reported', 'All'].map((tab) => {
              const count = tab === 'Pending' ? summary.pending : 
                            tab === 'Approved' ? summary.approved : 
                            tab === 'Rejected' ? summary.rejected : 
                            tab === 'Featured' ? summary.featured : 
                            tab === 'Reported' ? summary.reported : 
                            summary.totalReviews;
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wide cursor-pointer transition-all ${
                    statusFilter === tab
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                  <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-md font-bold ${
                    statusFilter === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-grow max-w-sm">
            <div className="relative flex-grow">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews, student name..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-primary focus:bg-white"
              />
            </div>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary hover:bg-primaryHover text-white font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer"
            >
              Go
            </button>
          </form>
        </div>

        {/* Filters dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Department</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Rating</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            >
              <option value="All">All Ratings</option>
              {[5, 4, 3, 2, 1].map(r => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Created Date</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            />
          </div>
        </div>

        {/* Reviews Lists */}
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((item) => {
              const initials = item.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const isPending = item.status === 'pending';
              const isApproved = item.status === 'approved';
              const isRejected = item.status === 'rejected';

              return (
                <div 
                  key={item.id} 
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 shadow-3xs relative overflow-hidden bg-white/50 backdrop-blur-md ${
                    item.report_count > 0 ? 'border-rose-300 bg-rose-50/5' : 'border-surfaceVariant/60'
                  }`}
                >
                  {item.report_count > 0 && (
                    <span className="absolute top-4 right-20 flex items-center gap-1 text-[8.5px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <AlertTriangle size={10} />
                      Reported ({item.report_count})
                    </span>
                  )}

                  {/* Top card metadata */}
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primaryContainer text-primary font-black flex items-center justify-center shadow-3xs uppercase">
                        {initials}
                      </div>
                      <div className="leading-tight text-left">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-onSurface">{item.student_name}</h4>
                          <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                            {item.visibility === 'anonymous' ? 'Anonymous' : 'Public'}
                          </span>
                          {item.featured && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                              <Award size={9} className="fill-amber-600" />
                              Featured
                            </span>
                          )}
                          {item.is_pinned && (
                            <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-800 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                              <Pin size={9} className="fill-blue-600" />
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-onSurfaceVariant font-bold mt-1">
                          {item.department} • Year {item.year}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span className={`text-[9px] px-2.5 py-1 rounded-xl font-black tracking-wide uppercase ${
                        isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        isRejected ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            className={i < item.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}
                          />
                        ))}
                      </div>
                      <h5 className="text-xs font-black text-onSurface leading-snug">{item.title}</h5>
                      <span className="text-[9.5px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded ml-2 uppercase">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[12px] text-onSurfaceVariant leading-relaxed font-semibold italic">
                      "{item.description}"
                    </p>
                  </div>

                  {/* Admin Reply & Internal Notes info */}
                  {(item.admin_reply || item.admin_notes) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/50">
                      {item.admin_reply && (
                        <div className="space-y-1 text-left">
                          <span className="text-[8.5px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                            <MessageSquare size={11} />
                            Admin Reply
                          </span>
                          <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">"{item.admin_reply}"</p>
                        </div>
                      )}
                      {item.admin_notes && (
                        <div className="space-y-1 text-left border-t md:border-t-0 md:border-l border-slate-200 pt-2.5 md:pt-0 md:pl-4">
                          <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck size={11} />
                            Internal Notes
                          </span>
                          <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">"{item.admin_notes}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card bottom buttons / Actions footer */}
                  <div className="pt-3.5 border-t border-outline/10 flex flex-wrap items-center justify-between gap-3 text-[10px] text-onSurfaceVariant/60 font-bold">
                    <div className="flex gap-4 items-center flex-wrap">
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={12} className="text-slate-400" />
                        <span>{item.helpful_count} helpful clicks</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span>Submitted on {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleAction(item.id, { status: 'approved' })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            disabled={modifyingId === item.id}
                          >
                            <Check size={13} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(item.id, { status: 'rejected' })}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            disabled={modifyingId === item.id}
                          >
                            <X size={13} />
                            Reject
                          </button>
                        </>
                      )}

                      {!isPending && isApproved && (
                        <button
                          onClick={() => handleAction(item.id, { status: 'rejected' })}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-colors cursor-pointer"
                          disabled={modifyingId === item.id}
                        >
                          Reject
                        </button>
                      )}

                      {!isPending && isRejected && (
                        <button
                          onClick={() => handleAction(item.id, { status: 'approved' })}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-colors cursor-pointer"
                          disabled={modifyingId === item.id}
                        >
                          Approve
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenReplyModal(item)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-colors cursor-pointer"
                        disabled={modifyingId === item.id}
                      >
                        Reply & Notes
                      </button>

                      <button
                        onClick={() => handleAction(item.id, { featured: !item.featured })}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                          item.featured ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        disabled={modifyingId === item.id}
                      >
                        <Award size={12} />
                        {item.featured ? 'Featured' : 'Feature'}
                      </button>

                      <button
                        onClick={() => handleAction(item.id, { is_pinned: !item.is_pinned })}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                          item.is_pinned ? 'bg-blue-100 text-blue-800 animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        disabled={modifyingId === item.id}
                      >
                        <Pin size={12} />
                        {item.is_pinned ? 'Pinned' : 'Pin'}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                        title="Edit Review Details"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        onClick={() => handleAction(item.id, { status: 'rejected', admin_notes: 'Spam' })}
                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-[11px] font-black transition-colors cursor-pointer border border-orange-200"
                        title="Mark Spam"
                      >
                        Spam
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer"
                        title="Delete Review Permanently"
                        disabled={modifyingId === item.id}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="border border-dashed border-outline/35 rounded-2xl py-12 text-center space-y-3.5 bg-slate-50/50">
              <span className="material-symbols-outlined text-[36px] text-onSurfaceVariant/30">find_in_page</span>
              <p className="text-xs text-onSurfaceVariant/70 italic">No reviews found matching the filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* === ADMIN REPLY & NOTES MODAL === */}
      {isReplyModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Review Moderation Dialog</h3>
              <button onClick={() => setIsReplyModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border text-xs font-semibold leading-relaxed">
              <p className="font-bold text-slate-700">{selectedReview.student_name}:</p>
              <p className="italic mt-1 text-slate-500">"{selectedReview.description}"</p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                  Admin Reply to Student (Visible to Public)
                </label>
                <textarea 
                  rows={3}
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Enter direct reply message to the student..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-primary focus:bg-white resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                  Internal notes / Reason (Only Admins can see)
                </label>
                <textarea 
                  rows={2}
                  value={adminNotesText}
                  onChange={(e) => setAdminNotesText(e.target.value)}
                  placeholder="e.g. Duplicate account, inappropriate content, flagged spam..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-primary focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReplyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send size={12} />
                  Save Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === ADMIN EDIT REVIEW DETAILS MODAL === */}
      {isEditModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Edit Review Content</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                  Modify Rating
                </label>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  {[5, 4, 3, 2, 1].map(r => (
                    <option key={r} value={r}>{r} Stars</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                  Modify Title
                </label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                  Modify Description
                </label>
                <textarea 
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-primary focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReviews;
