import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import ActivityManagerSkeleton from '../skeletons/ActivityManagerSkeleton';

const ToDoWidget = ({ onOpenModal, refreshTrigger }) => {
  const { token } = useApp();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks/summary', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to load ToDo summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [token, refreshTrigger]);

  if (loading && !summary) {
    return (
      <div className="bg-white border border-outline/40 rounded-[24px] p-6 shadow-sm">
        <ActivityManagerSkeleton />
      </div>
    );
  }

  const {
    total = 0,
    pending = 0,
    completed = 0,
    dueToday = 0,
    progressPercentage = 0,
    previewTasks = []
  } = summary || {};

  // Progress ring circumference
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div
      className="bg-white border border-outline/40 rounded-[24px] p-6 space-y-5 shadow-sm transition-all duration-200 hover:shadow-md text-left"
      style={{
        borderLeft: '4px solid #1B4DA6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)'
      }}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primaryContainer flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[22px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
              task_alt
            </span>
          </div>
          <div>
            <h3 className="text-[16px] font-black text-onSurface tracking-tight">Activity Manager</h3>
            <p className="text-[11px] font-semibold text-onSurfaceVariant">Personal companion</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenModal('all')}
          className="text-[12px] font-extrabold text-primary hover:text-primaryHover bg-primaryContainer/40 hover:bg-primaryContainer/70 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
        >
          <span>View All</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>

      {/* Stats Summary Grid & Progress Ring */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50/70 p-4 rounded-2xl border border-outline/20">
        {/* Progress Ring */}
        <div className="flex items-center gap-3 justify-center sm:justify-start">
          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="text-slate-200"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="text-primary transition-all duration-700 ease-out"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[13px] font-black text-onSurface">{progressPercentage}%</span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-onSurfaceVariant">Completion</span>
            <p className="text-[13px] font-extrabold text-onSurface">{completed} of {total} Done</p>
          </div>
        </div>

        {/* Micro Counters */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-white p-2 rounded-xl border border-outline/10 shadow-2xs">
            <span className="text-[10px] font-bold text-onSurfaceVariant uppercase">Pending</span>
            <p className="text-[15px] font-black text-amber-600">{pending}</p>
          </div>
          <div className="bg-white p-2 rounded-xl border border-outline/10 shadow-2xs">
            <span className="text-[10px] font-bold text-onSurfaceVariant uppercase">Due Today</span>
            <p className="text-[15px] font-black text-blue-600">{dueToday}</p>
          </div>
        </div>
      </div>

      {/* Task Preview (Next 3 Pending) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">
            Upcoming Tasks ({previewTasks.length})
          </span>
          {dueToday > 0 && (
            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {dueToday} due today
            </span>
          )}
        </div>

        {previewTasks.length === 0 ? (
          <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-outline/30">
            <span className="material-symbols-outlined text-gray-400 text-2xl mb-1">sentiment_satisfied</span>
            <p className="text-xs font-semibold text-onSurfaceVariant">All caught up! No pending tasks.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {previewTasks.map((t) => {
              const isHigh = t.priority === 'high';
              const isMed = t.priority === 'medium';
              return (
                <div
                  key={t.id}
                  onClick={() => onOpenModal('all')}
                  className="p-3 bg-white hover:bg-slate-50 border border-outline/20 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-primary/40 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-gray-400 group-hover:text-primary transition-colors">
                      radio_button_unchecked
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-onSurface truncate group-hover:text-primary transition-colors">
                        {t.title}
                      </p>
                      <span className="text-[10px] font-medium text-onSurfaceVariant">
                        {t.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isHigh ? 'bg-red-100 text-red-700' : isMed ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex gap-3">
        <button
          type="button"
          onClick={() => onOpenModal('add')}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white text-[13px] font-bold py-2.5 px-4 rounded-full transition-all duration-150 active:scale-[0.98] shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Add Task</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('all')}
          className="inline-flex items-center justify-center gap-1.5 bg-white border border-outline/60 text-primary text-[13px] font-bold py-2.5 px-4 rounded-full hover:bg-surfaceContainer transition-all active:scale-[0.98]"
        >
          <span>View All</span>
        </button>
      </div>
    </div>
  );
};

export default ToDoWidget;
