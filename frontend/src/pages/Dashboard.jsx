import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import BusRouteWidget from '../components/dashboard/BusRouteWidget';
import ToastSnackbar from '../components/common/ToastSnackbar';
import FloatingNotice from '../components/notices/FloatingNotice';

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

const INTERESTS = [
  'Coding', 'Robotics & Hardware', 'Arts & Crafts', 'Debate & Public Speaking',
  'Sports & Athletics', 'Volunteering', 'Tamil Culture', 'Other'
];

const getDeptTheme = (deptName) => {
  const d = (deptName || '').toLowerCase();
  if (d.includes('computer') || d.includes('cse') || d.includes('it') || d.includes('information')) {
    return {
      accent: 'border-l-[4px] border-l-blue-600',
      gradient: 'from-blue-600 to-indigo-900',
      borderAccent: 'border-blue-500/20',
      text: 'text-blue-600',
      bg: 'bg-blue-50/50',
      badge: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  }
  if (d.includes('electronics') || d.includes('ece') || d.includes('electrical') || d.includes('eee') || d.includes('instrumentation') || d.includes('ice')) {
    return {
      accent: 'border-l-[4px] border-l-teal-600',
      gradient: 'from-teal-600 to-cyan-900',
      borderAccent: 'border-teal-500/20',
      text: 'text-teal-600',
      bg: 'bg-teal-50/50',
      badge: 'bg-teal-50 text-teal-700 border-teal-200'
    };
  }
  if (d.includes('mechanical') || d.includes('mech') || d.includes('civil')) {
    return {
      accent: 'border-l-[4px] border-l-amber-600',
      gradient: 'from-amber-600 to-orange-950',
      borderAccent: 'border-amber-500/20',
      text: 'text-amber-600',
      bg: 'bg-amber-50/50',
      badge: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  }
  return {
    accent: 'border-l-[4px] border-l-indigo-600',
    gradient: 'from-indigo-600 to-slate-900',
    borderAccent: 'border-indigo-500/20',
    text: 'text-indigo-600',
    bg: 'bg-indigo-50/50',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };
};

const Dashboard = () => {
  const { studentData, resetAllData, token, updateProfile, user, dbReadNotices, dbBookmarkedNotices, markNoticeReadDb, toggleNoticeBookmarkDb, notifications, markNotificationRead } = useApp();
  const navigate = useNavigate();

  const name       = studentData?.name       || 'Freshman';
  const dept       = studentData?.department || 'Computer Science';
  const isHostel   = studentData?.isHosteller;
  const interests  = studentData?.interests  || [];
  const gender     = studentData?.gender     || 'Male';
  const travelMode = studentData?.travel_mode || 'own_transport';

  const theme = getDeptTheme(dept);

  // Initials for avatar
  const initials = name
    ? name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SD';

  const [dbFaculty, setDbFaculty] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [deptRecord, setDeptRecord] = useState(null);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Dynamic filter states
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyDesigFilter, setFacultyDesigFilter] = useState('all');
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('all');
  const [noticeViewMode, setNoticeViewMode] = useState('all'); // 'all' | 'bookmarks'

  // Interactive Registrations (localStorage) & Bookmarks (DB-backed)
  const [registeredEventIds, setRegisteredEventIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('pm_registered_events') || '[]')); }
    catch { return new Set(); }
  });

  // DB-backed notice bookmarks & reads (synced from context)
  const bookmarkedNoticeIds = new Set(dbBookmarkedNotices);
  const readNoticeIds = new Set(dbReadNotices);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);

  // Profile Editor Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(studentData?.email || '');
  const [editDept, setEditDept] = useState(dept);
  const [editStayType, setEditStayType] = useState(isHostel ? 'hostel' : 'day_scholar');
  const [editHostelBlock, setEditHostelBlock] = useState(studentData?.hostel_block || 'B-Block (Boys Hostel)');
  const [editTravelMode, setEditTravelMode] = useState(travelMode);
  const [editInterests, setEditInterests] = useState(interests);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Study Streak Modal States
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [pendingTasks, setPendingTasks] = useState([]);

  // Student reviews states
  const [myReview, setMyReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewDescription, setReviewDescription] = useState('');
  const [reviewCategory, setReviewCategory] = useState('Overall Experience');
  const [reviewVisibility, setReviewVisibility] = useState('public');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewErrors, setReviewErrors] = useState({});

  const fetchMyReview = async () => {
    try {
      const res = await fetch('/api/reviews/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.review) {
        setMyReview(data.review);
      } else {
        setMyReview(null);
      }
    } catch (err) {
      console.error('Failed to fetch review:', err);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleOpenReviewModal = (review = null) => {
    if (review) {
      setReviewRating(review.rating);
      setReviewTitle(review.title);
      setReviewDescription(review.description);
      setReviewCategory(review.category);
      setReviewVisibility(review.visibility);
    } else {
      setReviewRating(5);
      setReviewTitle('');
      setReviewDescription('');
      setReviewCategory('Overall Experience');
      setReviewVisibility('public');
    }
    setReviewErrors({});
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewErrors({});

    const errors = {};
    if (reviewTitle.trim().length < 3 || reviewTitle.trim().length > 100) {
      errors.title = 'Title must be between 3 and 100 characters.';
    }
    if (reviewDescription.trim().length < 10 || reviewDescription.trim().length > 1000) {
      errors.description = 'Review description must be between 10 and 1000 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setReviewErrors(errors);
      setSubmittingReview(false);
      return;
    }

    try {
      const method = myReview ? 'PUT' : 'POST';
      const url = myReview ? '/api/reviews/my' : '/api/reviews';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle.trim(),
          description: reviewDescription.trim(),
          category: reviewCategory,
          visibility: reviewVisibility
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      showNotification(myReview ? 'Review updated and is pending moderation!' : 'Review submitted successfully and is pending moderation!', 'success');
      setIsReviewModalOpen(false);
      fetchMyReview();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your review?')) return;
    try {
      const res = await fetch('/api/reviews/my', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete review.');
      }
      showNotification('Review deleted successfully.', 'success');
      setMyReview(null);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyReview();
    }
  }, [token]);

  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const match = data.find(d => d.name === dept || d.full_name?.toLowerCase().includes(dept.toLowerCase()));
          setDeptRecord(match || data[0]);
        }
      })
      .catch(()=>{});

    fetch('/api/notices')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotices(data); })
      .catch(()=>{});

    fetch('/api/events')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEvents(data); })
      .catch(()=>{});
  }, [dept]);

  const deptFullName = deptRecord?.full_name || dept;

  useEffect(() => {
    if (deptRecord?.id) {
      setLoadingFaculty(true);
      fetch(`/api/faculty/${deptRecord.id}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setDbFaculty(data);
        })
        .catch(()=>{})
        .finally(() => setLoadingFaculty(false));
    }
  }, [deptRecord?.id, token]);

  const getDesignationWeight = (desig) => {
    const d = (desig || '').toLowerCase();
    if (d.includes('head') || d.includes('hod')) return 1;
    if (d.includes('professor') && !d.includes('assistant') && !d.includes('associate')) return 2;
    if (d.includes('associate professor') || d.includes('assoc')) return 3;
    if (d.includes('assistant professor') || d.includes('asst')) return 4;
    return 5;
  };

  const sortedFaculty = [...dbFaculty].sort((a, b) => getDesignationWeight(a.designation) - getDesignationWeight(b.designation));

  const filteredFaculty = sortedFaculty.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(facultySearch.toLowerCase()) || 
                          (f.cabin && f.cabin.toLowerCase().includes(facultySearch.toLowerCase()));
    
    const matchesDesig = facultyDesigFilter === 'all' || 
                         (facultyDesigFilter === 'hod' && (f.hod_status || f.designation.toLowerCase().includes('head') || f.designation.toLowerCase().includes('hod'))) ||
                         (facultyDesigFilter === 'professor' && f.designation.toLowerCase().includes('professor') && !f.designation.toLowerCase().includes('assistant')) ||
                         (facultyDesigFilter === 'assistant' && f.designation.toLowerCase().includes('assistant'));

    return matchesSearch && matchesDesig;
  });

  const getProfileCompletion = () => {
    let score = 0;
    if (name && name !== 'Freshman') score += 20;
    if (dept) score += 20;
    if (interests && interests.length > 0) score += 20;
    if (isHostel !== null && isHostel !== undefined) score += 20;
    if (travelMode) score += 20;
    return score;
  };

  const profileCompletion = getProfileCompletion();

  // Load study streak from backend database
  useEffect(() => {
    if (token) {
      fetch('/api/study/streak', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && typeof data.streak === 'number') {
            setStudyStreak(data.streak);
            localStorage.setItem('pm_study_streak', data.streak.toString());
          }
        })
        .catch(()=>{});
    }
  }, [token]);

  // Load pending tasks to display in the Study Streak modal
  useEffect(() => {
    if (token && isStreakModalOpen) {
      fetch('/api/tasks?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setPendingTasks(data.slice(0, 3));
        })
        .catch(()=>{});
    }
  }, [token, isStreakModalOpen]);

  // Keep edit fields updated when studentData changes or modal opens
  useEffect(() => {
    if (studentData) {
      setEditName(studentData.name || '');
      setEditEmail(studentData.email || '');
      setEditDept(studentData.department || '');
      setEditStayType(studentData.isHosteller ? 'hostel' : 'day_scholar');
      setEditHostelBlock(studentData.hostel_block || 'B-Block (Boys Hostel)');
      setEditTravelMode(studentData.travel_mode || 'own_transport');
      setEditInterests(studentData.interests || []);
    }
  }, [studentData, isProfileModalOpen]);

  const handleEditProfile = () => {
    setIsProfileModalOpen(true);
  };

  const toggleEditInterest = (interest) => {
    setEditInterests(prev => {
      const next = [...prev];
      const idx = next.indexOf(interest);
      if (idx !== -1) {
        next.splice(idx, 1);
      } else {
        next.push(interest);
      }
      return next;
    });
  };

  const handleCompleteTask = async (taskId, taskTitle) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      if (!res.ok) throw new Error('Failed to complete task');
      const data = await res.json();
      if (data) {
        showNotification(`Completed task: ${taskTitle}`, 'success');
        setPendingTasks(prev => prev.filter(t => t.id !== taskId));
        // Refetch streak
        fetch('/api/study/streak', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(streakData => {
            if (streakData.success && typeof streakData.streak === 'number') {
              setStudyStreak(streakData.streak);
              localStorage.setItem('pm_study_streak', streakData.streak.toString());
            }
          })
          .catch(()=>{});
      }
    } catch (err) {
      showNotification(err.message || 'Error updating task', 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!editName.trim()) {
      showNotification('Name is required', 'error');
      return;
    }
    setIsSavingProfile(true);
    try {
      const updated = await updateProfile({
        full_name: editName.trim(),
        email: editEmail.trim(),
        department: editDept,
        stay_type: editStayType,
        hostel_block: editStayType === 'hostel' ? editHostelBlock : null,
        travel_mode: editStayType !== 'hostel' ? editTravelMode : null,
        interests: editInterests
      });
      if (updated) {
        showNotification('Profile updated successfully!', 'success');
        setIsProfileModalOpen(false);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  const toggleBookmark = (e, id) => {
    e.stopPropagation();
    const isBookmarked = bookmarkedNoticeIds.has(id);
    toggleNoticeBookmarkDb(id);
    if (isBookmarked) {
      showNotification('Notice removed from bookmarks.', 'info');
    } else {
      showNotification('Notice saved to bookmarks.', 'success');
    }
  };

  const toggleRegisterEvent = async (id, eventName) => {
    const isRegistered = registeredEventIds.has(id);
    const userId = user?.id;

    if (!userId) {
      showNotification('Please log in to register for events.', 'error');
      return;
    }

    try {
      if (isRegistered) {
        setRegisteredEventIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          localStorage.setItem('pm_registered_events', JSON.stringify([...next]));
          return next;
        });
        showNotification(`Cancelled registration for ${eventName}`, 'info');
      } else {
        const res = await fetch('/api/registrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            clubOrEventType: 'event',
            clubOrEventId: id
          })
        });

        if (!res.ok) {
          throw new Error('Registration failed');
        }

        const data = await res.json();
        if (data.success) {
          // Proactively try to trigger checklist generation for this event
          fetch(`/api/checklist/${data.registrationId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(()=>{});

          setRegisteredEventIds(prev => {
            const next = new Set(prev);
            next.add(id);
            localStorage.setItem('pm_registered_events', JSON.stringify([...next]));
            return next;
          });
          showNotification(`Registered successfully for ${eventName}!`, 'success');
        }
      }
    } catch (err) {
      showNotification('Failed to register: ' + err.message, 'error');
    }
  };

  const incrementStreak = () => {
    setIsStreakModalOpen(true);
  };

  const markNoticeRead = (noticeId) => {
    markNoticeReadDb(noticeId);
  };

  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(noticeSearch.toLowerCase()) || 
                          n.content.toLowerCase().includes(noticeSearch.toLowerCase());
    const matchesCat = noticeCategory === 'all' || n.category === noticeCategory;
    const matchesView = noticeViewMode === 'all' || bookmarkedNoticeIds.has(n.id);
    return matchesSearch && matchesCat && matchesView;
  });

  const unreadNoticeCount = notices.filter(n => !readNoticeIds.has(n.id)).length;

  return (
    <div className="space-y-8 font-sans animate-fade-in py-6 max-w-5xl mx-auto text-left select-none px-4 sm:px-6">
      
      {/* === WELCOME HERO BANNER === */}
      <div className={`bg-gradient-to-r ${theme.gradient} text-white rounded-[28px] p-6 sm:p-8 shadow-elevation2 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
        {/* Decorative background overlay */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-3 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold tracking-wide border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Verified SCE Student Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {name.split(' ')[0]}! 👋
          </h1>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed font-medium">
            Your personalized campus hub for academic guidance, student connect, study resources, and official notices.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto z-10">
          <button
            onClick={() => navigate('/connect')}
            className="bg-white text-primary hover:bg-slate-100 px-5 py-3 rounded-full font-black text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">groups</span>
            Find Peer Mentors
          </button>
          <button
            onClick={() => navigate('/study-hub')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-5 py-3 rounded-full font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-white/10"
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            Study Hub
          </button>
        </div>
      </div>

      {/* ── TODAY'S SNAPSHOT (DYNAMIC DASHBOARD WIDGET) ── */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase text-onSurfaceVariant/80 tracking-widest flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
          Today's Campus Snapshot
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-surface border border-outline/15 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors shadow-3xs">
            <span className="text-[10px] font-black uppercase text-onSurfaceVariant/70 tracking-wider">Classes Today</span>
            <div className="mt-2.5">
              <span className="text-xl font-extrabold text-onSurface">4 lectures</span>
              <p className="text-[9px] text-onSurfaceVariant/80 font-bold mt-0.5 uppercase tracking-wide text-primary">Live Timetable</p>
            </div>
          </div>

          <div className="bg-surface border border-outline/15 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors shadow-3xs">
            <span className="text-[10px] font-black uppercase text-onSurfaceVariant/70 tracking-wider">Unread Circulars</span>
            <div className="mt-2.5">
              <span className={`text-xl font-extrabold ${unreadNoticeCount > 0 ? 'text-rose-600' : 'text-onSurface'}`}>{unreadNoticeCount} unread</span>
              <p className="text-[9px] text-onSurfaceVariant/80 font-bold mt-0.5 uppercase tracking-wide">Notices board</p>
            </div>
          </div>

          <div className="bg-surface border border-outline/15 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors shadow-3xs">
            <span className="text-[10px] font-black uppercase text-onSurfaceVariant/70 tracking-wider">Events This Week</span>
            <div className="mt-2.5">
              <span className="text-xl font-extrabold text-onSurface">{events.length} planned</span>
              <p className="text-[9px] text-onSurfaceVariant/80 font-bold mt-0.5 uppercase tracking-wide text-indigo-600">Events Directory</p>
            </div>
          </div>

          <div className="bg-surface border border-outline/15 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors shadow-3xs">
            <span className="text-[10px] font-black uppercase text-onSurfaceVariant/70 tracking-wider">Transit Details</span>
            <div className="mt-2.5">
              <span className="text-sm font-extrabold text-onSurface truncate block">
                {isHostel ? 'Mess open' : 'Bus leaves'}
              </span>
              <p className="text-[9px] text-onSurfaceVariant/80 font-bold mt-1 uppercase tracking-wide">
                {isHostel ? 'Dinner at 7:30PM' : 'Route 12 at 4:45PM'}
              </p>
            </div>
          </div>

          <div className="bg-surface border border-outline/15 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors shadow-3xs">
            <span className="text-[10px] font-black uppercase text-onSurfaceVariant/70 tracking-wider">Mentors Connected</span>
            <div className="mt-2.5">
              <span className="text-xl font-extrabold text-onSurface">2 active</span>
              <p className="text-[9px] text-onSurfaceVariant/80 font-bold mt-0.5 uppercase tracking-wide text-emerald-600">Senior connect</p>
            </div>
          </div>

          <div className="bg-surface border border-outline/15 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors shadow-3xs relative overflow-hidden group">
            <div className="absolute right-1 top-1 text-orange-500 opacity-15 select-none transform rotate-12 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[44px]">local_fire_department</span>
            </div>
            <span className="text-[10px] font-black uppercase text-onSurfaceVariant/70 tracking-wider">Study Streak</span>
            <div className="mt-2.5 z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-orange-600">{studyStreak} Days</span>
                <button 
                  onClick={incrementStreak}
                  className="p-1 hover:bg-orange-100 rounded-full text-orange-600 cursor-pointer active:scale-95 transition-transform"
                  title="Extend Streak"
                >
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                </button>
              </div>
              <p className="text-[9px] text-onSurfaceVariant/85 font-black mt-0.5 uppercase tracking-wide">Click to Extend</p>
            </div>
          </div>
        </div>
      </section>

      {/* === SMART ACTION CARDS GRID === */}
      <div className={`grid grid-cols-2 ${isHostel ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4`}>
        {[
          { title: 'Roommate Matcher', desc: 'Find accommodation roommates.', stats: 'Verified Hostel', icon: 'bedroom_parent', color: 'text-purple-600', bg: 'bg-purple-50', path: '/connect', show: isHostel },
          { title: 'Senior Mentors', desc: 'Get placement & syllabus tips.', stats: '12 Seniors Active', icon: 'school', color: 'text-blue-600', bg: 'bg-blue-50', path: '/connect', show: true },
          { title: 'Clubs & Events', desc: 'Register for upcoming fests.', stats: `${events.length} Upcoming`, icon: 'celebration', color: 'text-amber-600', bg: 'bg-amber-50', path: '/clubs-events', show: true },
          { title: 'Campus Map', desc: 'Saranathan 3D floor map.', stats: 'GPS Calibrated', icon: 'map', color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/campus-map', show: true },
        ].filter(item => item.show).map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.path)}
            className="bg-surface border border-outline/20 rounded-2xl p-5 hover:border-primary/30 hover:shadow-elevation1 transition-all cursor-pointer flex flex-col justify-between gap-4 group relative"
          >
            <div className="absolute right-4 top-4 text-onSurfaceVariant/30 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
            <div>
              <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center font-bold mb-3.5`}>
                <span className="material-symbols-outlined text-[22px] select-none">{item.icon}</span>
              </div>
              <h3 className="text-sm font-extrabold text-onSurface leading-snug">{item.title}</h3>
              <p className="text-[11px] text-onSurfaceVariant/85 font-medium mt-1 leading-snug">{item.desc}</p>
            </div>
            <div className="pt-2 border-t border-outline/5 flex items-center justify-between">
              <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">{item.stats}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === LEFT COLUMN: STUDENT PROFILE & DEPARTMENT FACULTY (2 COLS) === */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* PROFILE BADGE IDENTITY CARD */}
          <div className="bg-surface border border-outline/20 rounded-3xl overflow-hidden shadow-3xs flex flex-col justify-between">
            <div className={`p-6 bg-gradient-to-r ${theme.gradient} text-white flex flex-col sm:flex-row justify-between items-start gap-4 relative`}>
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-center gap-4 z-10">
                <div className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center font-black text-xl shadow-md border-2 border-white/20 flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight">{name}</h2>
                    <span className="inline-flex items-center gap-0.5 bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md">
                      Freshman
                      <span className="material-symbols-outlined text-[10px]">verified</span>
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white/80 mt-0.5">{deptFullName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 z-10">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/15 border border-white/10 tracking-widest">
                  {isHostel ? 'Hosteller' : 'Day Scholar'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Profile Completion Indicator */}
              <div className="space-y-2 border-b border-outline/10 pb-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-onSurfaceVariant/80">
                  <span>Profile Completion</span>
                  <span className="text-primary">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-500" style={{ width: `${profileCompletion}%` }}></div>
                </div>
                {profileCompletion < 100 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-[11px] font-bold mt-2 flex items-center justify-between gap-3 flex-wrap">
                    <span>Complete your roommate finder choices and stay configurations.</span>
                    <button onClick={handleEditProfile} className="text-xs font-black text-amber-700 hover:underline cursor-pointer">Configure Now</button>
                  </div>
                )}
              </div>

              {/* Academic Interests */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest">
                  My Academic Interests & Focus Area
                </h3>
                {interests.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map(i => (
                      <span key={i} className="bg-slate-100 hover:bg-slate-200 border border-outline/15 text-slate-800 rounded-lg px-3 py-1 text-xs font-bold transition-colors">
                        {i}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-outline/30 rounded-2xl p-6 text-center space-y-3">
                    <span className="material-symbols-outlined text-[32px] text-onSurfaceVariant/35 select-none block">category</span>
                    <p className="text-xs text-onSurfaceVariant/70 italic leading-snug">No skill interests mapped to your student profile yet.</p>
                    <button onClick={handleEditProfile} className="px-3.5 py-1.5 bg-primary text-white font-bold rounded-xl text-[11px] shadow-2xs hover:bg-primaryHover cursor-pointer">
                      Map Interests
                    </button>
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline/10 text-[11px] font-bold text-onSurfaceVariant/85">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
                  <span>Active Account</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">workspace_premium</span>
                  <span>Onboarding Done</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/50 border-t border-outline/15 flex flex-wrap justify-between items-center gap-2 text-[10px] text-onSurfaceVariant/60 font-bold">
              <span>Member Since July 2026</span>
              <button
                type="button"
                onClick={handleEditProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline/30 hover:bg-slate-100 rounded-xl text-[10px] font-black text-onSurfaceVariant cursor-pointer active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Edit Profile
              </button>
            </div>
          </div>

          {/* DEPARTMENT FACULTY & HOD DIRECTORY (WITH LIVE SEARCH & SEARCH FILTERS) */}
          <div className="bg-surface border border-outline/25 rounded-3xl p-6 shadow-3xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline/10 pb-4">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Academic Department</span>
                <h2 className="text-base font-extrabold text-onSurface flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                  {dept} Department Desk
                </h2>
              </div>
            </div>

            {/* Inputs: Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-onSurfaceVariant/60 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search faculty name or cabin room..."
                  value={facultySearch}
                  onChange={(e) => setFacultySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-outline/35 rounded-xl text-xs bg-slate-50 outline-none focus:border-primary text-onSurface font-semibold"
                />
              </div>
              <div className="w-full sm:w-auto">
                <select
                  value={facultyDesigFilter}
                  onChange={(e) => setFacultyDesigFilter(e.target.value)}
                  className="w-full px-3.5 py-2 border border-outline/35 rounded-xl text-xs bg-slate-50 outline-none font-bold text-onSurface cursor-pointer"
                >
                  <option value="all">All Ranks</option>
                  <option value="hod">Dept Head (HOD)</option>
                  <option value="professor">Professors</option>
                  <option value="assistant">Assistant Profs</option>
                </select>
              </div>
            </div>

            {loadingFaculty ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 items-center animate-pulse py-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                      <div className="h-2.5 bg-slate-50 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFaculty.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredFaculty.map((f) => {
                  const avatarUrl = f.photo_url || f.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1B4DA6&color=fff&size=128`;
                  const isHOD = f.hod_status || f.designation.toLowerCase().includes('head') || f.designation.toLowerCase().includes('hod');
                  
                  return (
                    <div key={f.id || f.name} className="border border-outline/15 bg-slate-50/20 hover:bg-slate-50/50 hover:border-primary/20 rounded-2xl p-4 transition-all shadow-3xs relative flex flex-col justify-between gap-3 group">
                      <div className="flex gap-3 items-start">
                        <img
                          src={avatarUrl}
                          alt={f.name}
                          className="w-10 h-10 rounded-full object-cover border border-outline/20 flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1B4DA6&color=fff&size=128`;
                          }}
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-onSurface truncate flex items-center gap-1.5">
                            <span>{f.name}</span>
                            {isHOD && (
                              <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none">
                                HOD
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-onSurfaceVariant/85 font-semibold mt-0.5 truncate">{f.designation}</p>
                          <p className="text-[9px] text-onSurfaceVariant/70 mt-1 font-bold truncate flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-primary">meeting_room</span>
                            <span>Cabin: {f.cabin || 'Main Block'}</span>
                          </p>
                        </div>
                      </div>

                      {f.contact_email && (
                        <div className="pt-2 border-t border-outline/5 flex justify-end">
                          <a
                            href={`mailto:${f.contact_email}`}
                            className="inline-flex items-center gap-1 text-[10px] font-black text-primary hover:underline"
                          >
                            <span className="material-symbols-outlined text-[13px]">mail</span>
                            <span>Email Cabin</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-outline/35 rounded-2xl p-8 text-center space-y-2">
                <span className="material-symbols-outlined text-[32px] text-onSurfaceVariant/30">search_off</span>
                <p className="text-xs text-onSurfaceVariant/70 italic">No faculty members match your query.</p>
              </div>
            )}
          </div>

        </div>

        {/* === RIGHT COLUMN: NOTICES & UPCOMING EVENTS (1 COL) === */}
        <div className="space-y-8">
          
          {/* OFFICIAL NOTICES (WITH SEARCH, CATEGORY FILTERS & BOOKMARKS ACTION) */}
          <div className="bg-surface border border-outline/25 rounded-3xl p-5 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-outline/10 pb-3">
              <h2 className="text-xs font-black uppercase text-onSurfaceVariant/80 tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">campaign</span>
                Campus circulars
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setNoticeViewMode('all')}
                  className={`text-[9px] font-black px-2 py-0.5 rounded ${noticeViewMode === 'all' ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200 text-onSurfaceVariant'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setNoticeViewMode('bookmarks')}
                  className={`text-[9px] font-black px-2 py-0.5 rounded ${noticeViewMode === 'bookmarks' ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200 text-onSurfaceVariant'}`}
                >
                  Saved ({bookmarkedNoticeIds.size})
                </button>
              </div>
            </div>

            {/* Inputs: Search Notice */}
            <div className="space-y-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-onSurfaceVariant/60 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Filter notices..."
                  value={noticeSearch}
                  onChange={(e) => setNoticeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-outline/35 rounded-xl text-xs bg-slate-50 outline-none text-onSurface font-semibold"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                {['all', 'Academic', 'Exams', 'Sports'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNoticeCategory(cat === 'all' ? 'all' : cat)}
                    className={`px-2.5 py-1 text-[9px] font-black rounded-full border transition-all cursor-pointer ${
                      noticeCategory === cat ? 'bg-primaryContainer text-primary border-primary/20' : 'bg-slate-50 text-slate-600 border-outline/10'
                    }`}
                  >
                    {cat === 'all' ? 'All categories' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {filteredNotices.length > 0 ? (
                filteredNotices.map((n) => {
                  const isRead = readNoticeIds.has(n.id);
                  const isBookmarked = bookmarkedNoticeIds.has(n.id);
                  
                  // Category style rules
                  let catColor = 'border-l-slate-400';
                  if (n.category === 'Exams') catColor = 'border-l-rose-500';
                  if (n.category === 'Academic') catColor = 'border-l-blue-500';
                  if (n.category === 'Sports') catColor = 'border-l-emerald-500';

                  return (
                    <div 
                      key={n.id} 
                      onClick={() => { markNoticeRead(n.id); setSelectedNotice(n); }}
                      className={`p-3 rounded-2xl bg-slate-50/50 border border-outline/10 border-l-[3px] ${catColor} space-y-1.5 cursor-pointer hover:bg-slate-50 hover:shadow-3xs transition-all relative group ${isRead ? 'opacity-65' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-primary uppercase tracking-wide">{n.category || 'Notice'}</span>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={(e) => toggleBookmark(e, n.id)} 
                            className="text-onSurfaceVariant/60 hover:text-amber-500 p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Bookmark Notice"
                          >
                            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}>
                              {isBookmarked ? 'star' : 'star_outline'}
                            </span>
                          </button>
                          {isRead && <span className="material-symbols-outlined text-[13px] text-slate-400 select-none">mark_email_read</span>}
                        </div>
                      </div>
                      <h4 className={`text-xs font-black text-onSurface leading-snug group-hover:text-primary ${isRead ? 'font-medium text-slate-500' : ''}`}>{n.title}</h4>
                      <p className="text-[10px] text-onSurfaceVariant/85 line-clamp-2 leading-relaxed">{n.content}</p>
                    </div>
                  );
                })
              ) : (
                <div className="border border-dashed border-outline/35 rounded-2xl p-6 text-center space-y-2">
                  <span className="material-symbols-outlined text-[28px] text-onSurfaceVariant/30">campaign</span>
                  <p className="text-[11px] text-onSurfaceVariant/70 italic">No announcements found matching your selections.</p>
                </div>
              )}
            </div>
          </div>

          {/* OFFICIAL BUS ROUTES WIDGET */}
          {(travelMode === 'college_bus' || (gender === 'Female' && isHostel === true)) && (
            <BusRouteWidget />
          )}

          {/* UPCOMING EVENTS TIMELINE (WITH DYNAMIC REGISTER HOOKS) */}
          <div className="bg-surface border border-outline/25 rounded-3xl p-5 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-outline/10 pb-3">
              <h2 className="text-xs font-black uppercase text-onSurfaceVariant/80 tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">event</span>
                Academic events timeline
              </h2>
              <button onClick={() => navigate('/clubs-events')} className="text-[10px] font-black text-primary hover:underline">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {events.length > 0 ? (
                events.slice(0, 3).map((e) => {
                  const isRegistered = registeredEventIds.has(e.id);
                  const daysLeft = Math.ceil((new Date(e.event_date || e.date) - new Date()) / (1000 * 60 * 60 * 24));
                  const countdownText = daysLeft > 0 ? `In ${daysLeft} days` : daysLeft === 0 ? 'Today' : 'Completed';
                  
                  return (
                    <div key={e.id} className="p-3 rounded-2xl bg-slate-50/50 border border-outline/10 space-y-2 shadow-3xs flex flex-col justify-between hover:border-primary/20 transition-all">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-onSurface leading-snug truncate">{e.name || e.title}</h4>
                          <p className="text-[10px] text-onSurfaceVariant/80 font-medium truncate mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                            <span>{e.venue || 'Main Auditorium'}</span>
                          </p>
                        </div>
                        <span className="text-[9px] font-bold text-primary bg-primaryContainer px-2 py-0.5 rounded-full flex-shrink-0">
                          {countdownText}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-outline/5 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[9px] text-slate-400 font-bold">
                          {e.date ? new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Soon'}
                        </span>
                        <button
                          onClick={() => toggleRegisterEvent(e.id, e.name || e.title)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                            isRegistered ? 'bg-emerald-100 text-emerald-800' : 'bg-primary text-white hover:bg-primaryHover'
                          }`}
                        >
                          {isRegistered && <span className="material-symbols-outlined text-[12px]">check</span>}
                          <span>{isRegistered ? 'Registered' : 'Register Now'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="border border-dashed border-outline/35 rounded-2xl p-6 text-center space-y-2">
                  <span className="material-symbols-outlined text-[28px] text-onSurfaceVariant/30">event_busy</span>
                  <p className="text-[11px] text-onSurfaceVariant/70 italic">No college events upcoming.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── REVIEWS & NOTIFICATIONS CENTER ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-outline/10 text-left">
        {/* My Reviews (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black uppercase text-onSurfaceVariant/80 tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">rate_review</span>
              My PathMate Review & Rating
            </h2>
            {!myReview && !loadingReview && (
              <button
                onClick={() => handleOpenReviewModal(null)}
                className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Write a Review
              </button>
            )}
          </div>

          <div className="bg-surface border border-outline/15 rounded-3xl p-6 shadow-3xs flex flex-col justify-between min-h-[180px]">
            {loadingReview ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                <p className="text-[10px] text-onSurfaceVariant font-bold uppercase tracking-wider">Syncing Review Database...</p>
              </div>
            ) : myReview ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div>
                    <div className="flex gap-0.5 mb-1.5 select-none">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span 
                          key={i} 
                          className={`material-symbols-outlined text-base ${i < myReview.rating ? 'text-amber-500 fill-current' : 'text-slate-350'}`}
                          style={{ fontVariationSettings: i < myReview.rating ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <h3 className="text-sm font-extrabold text-onSurface leading-snug">{myReview.title}</h3>
                    <div className="flex gap-2 items-center mt-1 flex-wrap">
                      <span className="text-[9.5px] bg-primaryContainer text-onPrimaryContainer px-2 py-0.5 rounded font-black tracking-wide uppercase">
                        {myReview.category}
                      </span>
                      <span className={`text-[9.5px] px-2 py-0.5 rounded font-black tracking-wide uppercase flex items-center gap-1 ${
                        myReview.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        myReview.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {myReview.status === 'approved' ? 'Approved' : myReview.status === 'rejected' ? 'Rejected' : 'Pending Moderation'}
                      </span>
                      <span className="text-[9.5px] text-onSurfaceVariant/60 font-bold">
                        {myReview.visibility === 'anonymous' ? 'Anonymous' : 'Publicly Visible'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReviewModal(myReview)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-onSurfaceVariant hover:text-primary cursor-pointer active:scale-95 transition-all"
                      title="Edit Review"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={handleDeleteReview}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-onSurfaceVariant hover:text-rose-600 cursor-pointer active:scale-95 transition-all"
                      title="Delete Review"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                <p className="text-[12px] text-onSurfaceVariant/90 leading-relaxed font-semibold italic border-l-2 border-outline/10 pl-3">
                  "{myReview.description}"
                </p>

                {myReview.admin_reply && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[9.5px] font-black text-indigo-700 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[13px] fill-current">forum</span>
                      Administrator Response
                    </div>
                    <p className="text-[11.5px] text-indigo-900/90 leading-relaxed font-medium">
                      "{myReview.admin_reply}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-outline/25 rounded-2xl p-8 text-center space-y-3.5 flex-1 flex flex-col items-center justify-center">
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-3xs">
                  <span className="material-symbols-outlined text-[24px]">rate_review</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-onSurface">Share your Experience with PathMate</h4>
                  <p className="text-[11px] text-onSurfaceVariant/80 font-medium max-w-sm mx-auto leading-relaxed">
                    Write a review to help freshmen learn about AI chatbot guidance, campus directory navigation, study resource links, or mentor connections!
                  </p>
                </div>
                <button
                  onClick={() => handleOpenReviewModal(null)}
                  className="px-4 py-2 bg-primary hover:bg-primaryHover text-white font-black rounded-xl text-xs shadow-2xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                >
                  Write Review Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Hub (1 col) */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase text-onSurfaceVariant/80 tracking-widest flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">notifications_active</span>
            Notifications Hub
          </h2>

          <div className="bg-surface border border-outline/15 rounded-3xl p-5 shadow-3xs min-h-[180px] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] pr-1.5">
              {notifications && notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-3 relative group ${
                      n.is_read 
                        ? 'bg-slate-50/50 border-outline/5 opacity-60' 
                        : 'bg-primary/5 border-primary/20 shadow-4xs'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.is_read ? 'bg-slate-200/50 text-slate-500' : 'bg-primaryContainer text-primary'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {n.title.toLowerCase().includes('approve') ? 'check_circle' : 
                         n.title.toLowerCase().includes('reply') ? 'forum' : 'notifications'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-black text-onSurface leading-snug">{n.title}</h4>
                        {!n.is_read && (
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            className="text-[9px] font-black text-primary hover:underline flex-shrink-0 cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      <p className="text-[10.5px] text-onSurfaceVariant/85 font-medium mt-1 leading-snug break-words">
                        {n.message}
                      </p>
                      <span className="text-[8px] text-slate-400 font-bold block mt-1.5">
                        {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center h-full my-auto">
                  <span className="material-symbols-outlined text-[26px] text-onSurfaceVariant/30">notifications_off</span>
                  <p className="text-xs text-onSurfaceVariant/70 italic">No new system alerts.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ToastSnackbar
        isOpen={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />

      {selectedNotice && (
        <FloatingNotice 
          notice={selectedNotice} 
          onClose={() => setSelectedNotice(null)} 
          onMarkRead={markNoticeRead}
        />
      )}

      {/* === PROFILE EDITOR MODAL === */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Student Profile</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Customize your personal identity, stay and transit choices</p>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:border-primary text-slate-800 font-semibold"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:border-primary text-slate-800 font-semibold"
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Academic Department</label>
                <select 
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-primary text-slate-800 font-bold cursor-pointer"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Stay Type</label>
                  <select 
                    value={editStayType}
                    onChange={(e) => setEditStayType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-primary text-slate-800 font-bold cursor-pointer"
                  >
                    <option value="hostel">Hosteller</option>
                    <option value="day_scholar">Day Scholar</option>
                  </select>
                </div>

                {editStayType === 'hostel' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Hostel Block</label>
                    <select 
                      value={editHostelBlock}
                      onChange={(e) => setEditHostelBlock(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-primary text-slate-800 font-bold cursor-pointer"
                    >
                      <option value="B-Block (Boys Hostel)">B-Block (Boys Hostel)</option>
                      <option value="G-Block (Girls Hostel)">G-Block (Girls Hostel)</option>
                      <option value="LH-Block (Ladies Hostel)">LH-Block (Ladies Hostel)</option>
                      <option value="PG-Hostel">PG-Hostel</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Travel Mode</label>
                    <select 
                      value={editTravelMode}
                      onChange={(e) => setEditTravelMode(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-primary text-slate-800 font-bold cursor-pointer"
                    >
                      <option value="college_bus">College Bus</option>
                      <option value="own_transport">Own Transport</option>
                      <option value="private_transit">Private Transit</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Interests checklist as dynamic interactive chips */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Academic Interests & Focus Areas</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => {
                    const isSelected = editInterests.includes(interest);
                    return (
                      <button
                        type="button"
                        key={interest}
                        onClick={() => toggleEditInterest(interest)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                          isSelected 
                            ? 'bg-primary text-white border-primary shadow-sm' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-70"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === STUDY STREAK MODAL === */}
      {isStreakModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-scale-up relative">
            <button 
              onClick={() => setIsStreakModalOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shadow-3xs">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Study Streak Control</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Your study habit builder dashboard</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Current Streak</span>
                <div className="text-2xl font-black text-orange-600">{studyStreak} Days</div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Streak Status</span>
                <div className="text-xs font-black text-emerald-600 flex items-center gap-1 mt-0.5 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Today
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">school</span>
                 Streak Rules & Actions
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Your study streak grows when you complete tasks, quizzes, or milestones. 
                Complete a pending learning task below to extend your streak for today!
              </p>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pending Study Tasks</h4>
              {pendingTasks.length > 0 ? (
                <div className="space-y-2">
                  {pendingTasks.map((t) => (
                    <div 
                      key={t.id} 
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 hover:border-slate-200 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">
                          {t.category || 'Academic'}
                        </span>
                        <h5 className="text-xs font-black text-slate-800 truncate mt-1">{t.title}</h5>
                        {t.due_date && (
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                            <span>Due: {t.due_date}</span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleCompleteTask(t.id, t.title)}
                        className="w-7 h-7 rounded-lg bg-primary hover:bg-primaryHover text-white flex items-center justify-center cursor-pointer active:scale-95 shadow-sm hover:shadow-md transition-all flex-shrink-0"
                        title="Mark Complete"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-2xl p-5 text-center space-y-2 bg-slate-50/30">
                  <span className="material-symbols-outlined text-[24px] text-slate-350 block">task_alt</span>
                  <p className="text-xs text-slate-500 font-bold leading-normal">Awesome! No pending tasks right now.</p>
                  <button
                    onClick={() => { setIsStreakModalOpen(false); navigate('/study-hub'); }}
                    className="text-[10px] font-black text-primary hover:underline cursor-pointer"
                  >
                    Go to Study Hub to add tasks →
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center gap-3">
              <button
                onClick={() => { setIsStreakModalOpen(false); navigate('/study-hub'); }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                Open Study Hub
              </button>
              <button
                onClick={() => setIsStreakModalOpen(false)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* === WRITE / EDIT REVIEW DIALOG === */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-scale-up relative text-left overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-3xs">
                <span className="material-symbols-outlined text-[24px]">rate_review</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{myReview ? 'Edit My Review' : 'Write a Review'}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Help freshmen students learn about PathMate</p>
              </div>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4 pt-1">
              
              {/* Rating Experience */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                  Select Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 select-none">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = reviewHoverRating > 0 ? star <= reviewHoverRating : star <= reviewRating;
                      return (
                        <span 
                          key={star} 
                          className={`material-symbols-outlined text-3xl cursor-pointer transition-all duration-150 ${
                            isActive ? 'text-amber-500 fill-current scale-105' : 'text-slate-300'
                          }`}
                          style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                        >
                          star
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full capitalize">
                    {reviewRating === 1 ? 'Poor 😞' :
                     reviewRating === 2 ? 'Fair 😐' :
                     reviewRating === 3 ? 'Good 🙂' :
                     reviewRating === 4 ? 'Very Good 😃' :
                     'Excellent 😍'}
                  </span>
                </div>
              </div>

              {/* Review Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                  Review Category <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={reviewCategory} 
                  onChange={(e) => setReviewCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-xs font-bold text-slate-700 outline-none transition-all cursor-pointer"
                >
                  {APPROVED_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                  Review Title <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Incredibly intuitive wayfinder guide!"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-700 outline-none transition-all ${
                    reviewErrors.title ? 'border-rose-300 focus:border-rose-500 focus:bg-rose-50/10' : 'border-slate-200 focus:border-primary focus:bg-white'
                  }`}
                />
                {reviewErrors.title && (
                  <p className="text-[10px] font-bold text-rose-600">{reviewErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Review Details <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[9.5px] font-bold ${
                    reviewDescription.trim().length < 10 || reviewDescription.trim().length > 1000 ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {reviewDescription.trim().length} / 1000 (Min 10)
                  </span>
                </div>
                <textarea 
                  rows={4}
                  value={reviewDescription}
                  onChange={(e) => setReviewDescription(e.target.value)}
                  placeholder="Provide details about what you liked, HOD/Mentors contact search experience, Wi-Fi setups, or features that need improvement..."
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-700 outline-none transition-all resize-none ${
                    reviewErrors.description ? 'border-rose-300 focus:border-rose-500 focus:bg-rose-50/10' : 'border-slate-200 focus:border-primary focus:bg-white'
                  }`}
                />
                {reviewErrors.description && (
                  <p className="text-[10px] font-bold text-rose-600">{reviewErrors.description}</p>
                )}
              </div>

              {/* Visibility Preference */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                  Visibility Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewVisibility('public')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                      reviewVisibility === 'public' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>Public Review</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewVisibility('anonymous')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                      reviewVisibility === 'anonymous' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                    <span>Anonymous</span>
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-400 font-medium leading-normal mt-1.5 pl-1">
                  {reviewVisibility === 'public' 
                    ? 'Your full verified name and department will be displayed on the public Welcome Page.'
                    : 'Your review details are public, but your identity will show as "Anonymous Student".'}
                </p>
              </div>

              {/* Submit & Cancel Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-75"
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
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

export default Dashboard;
