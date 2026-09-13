import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

const ReviewPromptModal = ({ onOpenReview }) => {
  const { token } = useApp();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Check localStorage preference
    const rawPref = localStorage.getItem('pm_review_prompt_pref');
    if (rawPref) {
      try {
        const pref = JSON.parse(rawPref);
        if (pref.never === true || pref.action === 'submitted') return;
        
        // If 'maybe_later', check 7 days delay (7 * 24 * 60 * 60 * 1000 = 604800000ms)
        const SEVEN_DAYS = 604800000;
        if (pref.action === 'maybe_later' && Date.now() - (pref.timestamp || 0) < SEVEN_DAYS) {
          return;
        }
      } catch (err) {
        console.error('Error parsing review prompt preference:', err);
      }
    }

    // Check if user already submitted a review from backend
    let isSubscribed = true;
    fetch('/api/reviews/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!isSubscribed) return;
        if (data.success && data.review) {
          // Already submitted review, remember in localStorage and do not show
          localStorage.setItem('pm_review_prompt_pref', JSON.stringify({ action: 'submitted', timestamp: Date.now() }));
          return;
        }

        // Delay popup by 5 seconds so it never interrupts immediate login or page load
        const timer = setTimeout(() => {
          if (isSubscribed) {
            setShowPrompt(true);
          }
        }, 5000);

        return () => clearTimeout(timer);
      })
      .catch(() => {});

    return () => { isSubscribed = false; };
  }, [token]);

  const handleMaybeLater = () => {
    localStorage.setItem(
      'pm_review_prompt_pref',
      JSON.stringify({ action: 'maybe_later', timestamp: Date.now() })
    );
    setShowPrompt(false);
  };

  const handleNeverAskAgain = () => {
    localStorage.setItem(
      'pm_review_prompt_pref',
      JSON.stringify({ never: true, timestamp: Date.now() })
    );
    setShowPrompt(false);
  };

  const handleSubmitReview = () => {
    setShowPrompt(false);
    if (onOpenReview) onOpenReview();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-2xl animate-slide-up text-left">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[22px]">star_rate</span>
        </div>
        <button
          onClick={handleMaybeLater}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          title="Dismiss"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <h4 className="text-sm font-black text-slate-800 tracking-tight">How is your PathMate experience?</h4>
      <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
        Your honest feedback helps us improve campus navigation and student support for all freshers.
      </p>

      <div className="flex flex-col gap-2 pt-4">
        <button
          type="button"
          onClick={handleSubmitReview}
          className="w-full bg-primary hover:bg-primaryHover text-white font-extrabold text-xs py-2.5 px-4 rounded-full shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">rate_review</span>
          <span>Submit Review</span>
        </button>

        <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
          <button
            type="button"
            onClick={handleMaybeLater}
            className="text-slate-500 font-bold hover:text-slate-800 hover:underline cursor-pointer"
          >
            Maybe Later
          </button>
          <button
            type="button"
            onClick={handleNeverAskAgain}
            className="text-slate-400 font-medium hover:text-slate-600 hover:underline cursor-pointer"
          >
            Never Ask Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPromptModal;
