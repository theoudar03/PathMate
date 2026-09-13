import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

const APPROVED_CATEGORIES = [
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

const HomeReviewSection = () => {
  const { token, showNotification } = useApp();
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Overall Experience');
  const [visibility, setVisibility] = useState('public');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchMyReview = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/reviews/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.review) {
        setMyReview(data.review);
        setRating(data.review.rating);
        setTitle(data.review.title);
        setDescription(data.review.description);
        setCategory(data.review.category);
        setVisibility(data.review.visibility);
      } else {
        setMyReview(null);
      }
    } catch (err) {
      console.error('Failed to fetch review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReview();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const errs = {};
    if (title.trim().length < 3 || title.trim().length > 100) {
      errs.title = 'Title must be between 3 and 100 characters.';
    }
    if (description.trim().length < 10 || description.trim().length > 1000) {
      errs.description = 'Review description must be between 10 and 1000 characters.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
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
          rating,
          title: title.trim(),
          description: description.trim(),
          category,
          visibility
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      showNotification(
        myReview
          ? 'Your review has been updated and is pending admin moderation!'
          : 'Thank you! Your review was submitted successfully and is pending admin moderation.',
        'success'
      );

      // Save review submitted flag to suppress auto-prompts
      localStorage.setItem('pm_review_prompt_pref', JSON.stringify({ action: 'submitted', timestamp: Date.now() }));
      setIsEditing(false);
      fetchMyReview();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your review?')) return;
    try {
      const res = await fetch('/api/reviews/my', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete review.');
      showNotification('Your review was deleted successfully.', 'success');
      setMyReview(null);
      setIsEditing(true);
      setTitle('');
      setDescription('');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-outline/30 rounded-[20px] p-6 animate-pulse space-y-3 text-left">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-10 bg-slate-100 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline/40 rounded-[24px] p-6 sm:p-7 text-left space-y-5 relative overflow-hidden"
         style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">rate_review</span>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">My PathMate Review</h3>
            <p className="text-xs text-slate-500 font-semibold">
              {myReview ? 'Manage your submitted freshman experience review' : 'Share your experience to help future Saranathan freshers'}
            </p>
          </div>
        </div>

        {myReview && !isEditing && (
          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
            myReview.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            myReview.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {myReview.status}
          </span>
        )}
      </div>

      {/* Existing Review Display Card */}
      {myReview && !isEditing ? (
        <div className="space-y-4 bg-slate-50/70 border border-slate-200/60 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className="material-symbols-outlined text-lg fill-current"
                  style={{ fontVariationSettings: star <= myReview.rating ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              ))}
              <span className="text-xs font-black text-slate-700 ml-1.5">{myReview.rating} / 5</span>
            </div>
            <span className="text-[11px] font-extrabold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
              {myReview.category}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-slate-800">{myReview.title}</h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">{myReview.description}</p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 text-[11px] text-slate-400">
            <span>Submitted on {new Date(myReview.created_at).toLocaleDateString()}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span> Edit
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleDelete}
                className="text-red-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span> Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Review Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Rating Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Overall Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                >
                  <span
                    className={`material-symbols-outlined text-2xl transition-colors ${
                      star <= (hoverRating || rating) ? 'text-amber-500' : 'text-slate-300'
                    }`}
                    style={{ fontVariationSettings: star <= (hoverRating || rating) ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                </button>
              ))}
              <span className="text-xs font-bold text-slate-600 ml-2">
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
              </span>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {APPROVED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="public">Public (Show Name & Dept)</option>
                <option value="anonymous">Anonymous (Hide Name)</option>
              </select>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Review Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smooth campus onboarding & helpful campus map"
              maxLength={100}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
            />
            {errors.title && <p className="text-[11px] text-red-600 font-semibold">{errors.title}</p>}
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Feedback & Comments
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share what worked well for you and any suggestions for improvement..."
              rows={3}
              maxLength={1000}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            />
            {errors.description && <p className="text-[11px] text-red-600 font-semibold">{errors.description}</p>}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {myReview && isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primaryHover text-white font-extrabold text-xs py-2.5 px-6 rounded-full shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{myReview ? 'Update Review' : 'Submit Review'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HomeReviewSection;
