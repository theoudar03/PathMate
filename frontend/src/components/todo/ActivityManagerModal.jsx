import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../contexts/AppContext';
import ActivityManagerSkeleton from '../skeletons/ActivityManagerSkeleton';

const CATEGORY_OPTIONS = [
  'Academic',
  'College Activity',
  'Club Registration',
  'Workshops & Events',
  'Personal',
  'Career & Internship'
];

const COLOR_OPTIONS = [
  { label: 'Navy Blue', value: '#1B4DA6' },
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Emerald Green', value: '#16A34A' },
  { label: 'Amber Orange', value: '#D97706' },
  { label: 'Sky Blue', value: '#0284C7' },
  { label: 'Rose Red', value: '#DC2626' }
];

const ICON_OPTIONS = [
  'task_alt',
  'school',
  'event',
  'groups',
  'work',
  'star',
  'flag',
  'notifications'
];

const ActivityManagerModal = ({ isOpen, onClose, defaultTab = 'all', onTaskChanged }) => {
  const { token, navigate } = useApp();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'add', 'activities', 'completed', 'archived'
  const [taskTypeStep, setTaskTypeStep] = useState(null); // null, 'college_activity', 'personal_task'

  // Data states
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  // Personal Task Form State
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Academic');
  const [formPriority, setFormPriority] = useState('medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('');
  const [formReminder, setFormReminder] = useState('1 hour before');
  const [formNotes, setFormNotes] = useState('');
  const [formColor, setFormColor] = useState('#1B4DA6');
  const [formIcon, setFormIcon] = useState('task_alt');

  // Trigger subtle micro confetti burst on task complete
  const triggerConfetti = () => {
    try {
      const colors = ['#1B4DA6', '#7C3AED', '#16A34A', '#D97706', '#0284C7', '#DC2626'];
      for (let i = 0; i < 24; i++) {
        const p = document.createElement('div');
        p.style.position = 'fixed';
        p.style.left = `${50 + (Math.random() * 20 - 10)}%`;
        p.style.top = `${60 + (Math.random() * 10 - 5)}%`;
        p.style.width = '8px';
        p.style.height = '8px';
        p.style.borderRadius = '50%';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.zIndex = '10000';
        p.style.pointerEvents = 'none';
        p.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        document.body.appendChild(p);

        setTimeout(() => {
          p.style.transform = `translate(${(Math.random() - 0.5) * 200}px, ${-80 - Math.random() * 100}px) scale(0)`;
          p.style.opacity = '0';
        }, 20);

        setTimeout(() => {
          if (p.parentNode) p.parentNode.removeChild(p);
        }, 850);
      }
    } catch (e) {
      console.warn('Confetti effect failed:', e);
    }
  };

  // Synchronize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab === 'add' ? 'add' : 'all');
      setTaskTypeStep(defaultTab === 'add' ? null : null);
      fetchTasks();
      fetchAvailableActivities();
    }
  }, [isOpen, defaultTab]);

  // Fetch tasks for logged in student
  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch(`/api/tasks?include_archived=true`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Fetch active college activities
  const fetchAvailableActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await fetch(`/api/tasks/available-activities`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch available activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Reset task form
  const resetForm = () => {
    setEditingTaskId(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('Academic');
    setFormPriority('medium');
    setFormDueDate('');
    setFormDueTime('');
    setFormReminder('1 hour before');
    setFormNotes('');
    setFormColor('#1B4DA6');
    setFormIcon('task_alt');
  };

  // Handle create or edit task submission
  const handleSavePersonalTask = async (e) => {
    e.preventDefault();
    if (!formTitle || !formTitle.trim()) return;

    const payload = {
      title: formTitle.trim(),
      description: formDesc || '',
      task_type: 'personal_task',
      category: formCategory || 'Academic',
      priority: formPriority || 'medium',
      due_date: formDueDate || null,
      due_time: formDueTime || null,
      reminder: formReminder || '1 hour before',
      notes: formNotes || '',
      color: formColor || '#1B4DA6',
      icon: formIcon || 'task_alt'
    };

    try {
      const url = editingTaskId ? `/api/tasks/${editingTaskId}` : '/api/tasks';
      const method = editingTaskId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        resetForm();
        setTaskTypeStep(null);
        setActiveTab('all');
        await fetchTasks();
        if (onTaskChanged) onTaskChanged();
      } else {
        const errorData = await res.json();
        console.warn('API error saving task:', errorData);
        // Local fallback in case API errors out
        const localSaved = {
          id: editingTaskId || Date.now(),
          ...payload,
          status: 'pending',
          is_archived: false,
          created_at: new Date().toISOString()
        };
        setTasks(prev => editingTaskId ? prev.map(t => t.id === editingTaskId ? localSaved : t) : [localSaved, ...prev]);
        resetForm();
        setTaskTypeStep(null);
        setActiveTab('all');
        if (onTaskChanged) onTaskChanged();
      }
    } catch (err) {
      console.error('Error saving task:', err);
      // Fallback local save
      const localSaved = {
        id: editingTaskId || Date.now(),
        ...payload,
        status: 'pending',
        is_archived: false,
        created_at: new Date().toISOString()
      };
      setTasks(prev => editingTaskId ? prev.map(t => t.id === editingTaskId ? localSaved : t) : [localSaved, ...prev]);
      resetForm();
      setTaskTypeStep(null);
      setActiveTab('all');
      if (onTaskChanged) onTaskChanged();
    }
  };

  // Handle adding a College Activity to My Tasks
  const handleAddCollegeActivity = async (activity) => {
    const payload = {
      title: activity.title,
      description: `Linked ${activity.category}: ${activity.title} at ${activity.venue || 'Main Campus'}`,
      task_type: 'college_activity',
      activity_id: activity.id,
      activity_type: activity.activity_type,
      category: activity.category || 'College Activity',
      priority: 'high',
      due_date: activity.date ? new Date(activity.date).toISOString().split('T')[0] : null,
      color: '#7C3AED',
      icon: 'event'
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setTaskTypeStep(null);
        setActiveTab('all');
        await fetchTasks();
        if (onTaskChanged) onTaskChanged();
      } else {
        const localSaved = {
          id: Date.now(),
          ...payload,
          status: 'pending',
          is_archived: false,
          created_at: new Date().toISOString()
        };
        setTasks(prev => [localSaved, ...prev]);
        setTaskTypeStep(null);
        setActiveTab('all');
        if (onTaskChanged) onTaskChanged();
      }
    } catch (err) {
      console.error('Error adding activity task:', err);
      const localSaved = {
        id: Date.now(),
        ...payload,
        status: 'pending',
        is_archived: false,
        created_at: new Date().toISOString()
      };
      setTasks(prev => [localSaved, ...prev]);
      setTaskTypeStep(null);
      setActiveTab('all');
      if (onTaskChanged) onTaskChanged();
    }
  };

  // Task Status Toggle
  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    if (newStatus === 'completed') {
      triggerConfetti();
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        await fetchTasks();
        if (onTaskChanged) onTaskChanged();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Duplicate Task
  const handleDuplicate = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        await fetchTasks();
        if (onTaskChanged) onTaskChanged();
      }
    } catch (err) {
      console.error('Error duplicating task:', err);
    }
  };

  // Archive Task
  const handleArchive = async (taskId, currentArchivedState) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ is_archived: !currentArchivedState })
      });
      if (res.ok) {
        await fetchTasks();
        if (onTaskChanged) onTaskChanged();
      }
    } catch (err) {
      console.error('Error archiving task:', err);
    }
  };

  // Delete Task
  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        await fetchTasks();
        if (onTaskChanged) onTaskChanged();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Open task for editing
  const handleEditClick = (task) => {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormCategory(task.category || 'Academic');
    setFormPriority(task.priority || 'medium');
    setFormDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    setFormDueTime(task.due_time || '');
    setFormReminder(task.reminder || '1 hour before');
    setFormNotes(task.notes || '');
    setFormColor(task.color || '#1B4DA6');
    setFormIcon(task.icon || 'task_alt');
    setTaskTypeStep('personal_task');
    setActiveTab('add');
  };

  if (!isOpen) return null;

  // Filter tasks based on selected tab and options
  const activeTasks = tasks.filter(t => !t.is_archived && t.status !== 'completed');
  const completedTasks = tasks.filter(t => !t.is_archived && t.status === 'completed');
  const archivedTasks = tasks.filter(t => t.is_archived);

  let displayedTasks = activeTab === 'completed' ? completedTasks : activeTab === 'archived' ? archivedTasks : activeTasks;

  // Search & Filters
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    displayedTasks = displayedTasks.filter(t =>
      t.title?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.category?.toLowerCase().includes(query)
    );
  }

  if (selectedPriority !== 'all') {
    displayedTasks = displayedTasks.filter(t => t.priority === selectedPriority);
  }

  if (selectedCategory !== 'all') {
    displayedTasks = displayedTasks.filter(t => t.category === selectedCategory);
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto text-left font-sans">
      {/* Glassmorphism Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card Container */}
      <div
        className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[28px] shadow-2xl border border-white/40 overflow-hidden flex flex-col z-10 animate-modal-in transition-all"
        style={{
          boxShadow: '0 20px 50px rgba(15,23,42,0.22), 0 0 0 1px rgba(255,255,255,0.4)'
        }}
      >
        {/* Modal Top Header Bar */}
        <div className="px-6 py-5 bg-white border-b border-outline/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primaryContainer text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                task_alt
              </span>
            </div>
            <div>
              <h2 className="text-xl font-black text-onSurface tracking-tight">Personal Activity Manager</h2>
              <p className="text-xs text-onSurfaceVariant font-medium">PathMate companion for Saranathan Freshers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-onSurfaceVariant hover:text-onSurface rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-outline/15 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => { setActiveTab('all'); setTaskTypeStep(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'all' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">list_alt</span>
            <span>My Tasks ({activeTasks.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('add'); setTaskTypeStep(null); resetForm(); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'add' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ Add Task</span>
          </button>

          <button
            onClick={() => { setActiveTab('activities'); setTaskTypeStep(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'activities' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">event</span>
            <span>College Activities ({activities.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('completed'); setTaskTypeStep(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'completed' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">task_alt</span>
            <span>Completed ({completedTasks.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('archived'); setTaskTypeStep(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'archived' ? 'bg-primary text-white shadow-xs' : 'text-onSurfaceVariant hover:bg-slate-200/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">archive</span>
            <span>Archived ({archivedTasks.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ADD TASK OPTIONS / FORM */}
          {activeTab === 'add' && (
            <div className="space-y-6 animate-fade-in">
              {taskTypeStep === null && (
                <div className="space-y-6 py-4 text-center">
                  <div>
                    <h3 className="text-xl font-black text-onSurface">Choose Task Type</h3>
                    <p className="text-sm text-onSurfaceVariant mt-1">Select whether to link an official SCE college activity or create a custom task.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-2">
                    {/* Option 1: College Activity Card */}
                    <div
                      onClick={() => { setActiveTab('activities'); }}
                      className="bg-white border-2 border-primary/20 hover:border-primary rounded-[24px] p-6 text-left cursor-pointer transition-all hover:shadow-lg group flex flex-col justify-between space-y-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[32px]">domain</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                          Official SCE Records
                        </span>
                        <h4 className="text-lg font-black text-onSurface mt-2 group-hover:text-primary transition-colors">
                          College Activity
                        </h4>
                        <p className="text-xs text-onSurfaceVariant leading-relaxed mt-1">
                          Fetch events, clubs, committees, workshops, hackathons, and NSS activities live from SCE Postgres database.
                        </p>
                      </div>
                      <div className="flex justify-end pt-2">
                        <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Browse Activities <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </span>
                      </div>
                    </div>

                    {/* Option 2: Personal Task Card */}
                    <div
                      onClick={() => setTaskTypeStep('personal_task')}
                      className="bg-white border-2 border-blue-200 hover:border-blue-600 rounded-[24px] p-6 text-left cursor-pointer transition-all hover:shadow-lg group flex flex-col justify-between space-y-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[32px]">edit_note</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                          Custom Companion
                        </span>
                        <h4 className="text-lg font-black text-onSurface mt-2 group-hover:text-blue-600 transition-colors">
                          Personal Task
                        </h4>
                        <p className="text-xs text-onSurfaceVariant leading-relaxed mt-1">
                          Create personal academic tasks, reminders, study schedules, priorities, and custom color tags.
                        </p>
                      </div>
                      <div className="flex justify-end pt-2">
                        <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Create Custom Task <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Task Creation/Edit Form */}
              {taskTypeStep === 'personal_task' && (
                <form onSubmit={handleSavePersonalTask} className="space-y-6 max-w-2xl mx-auto bg-slate-50/60 p-6 rounded-3xl border border-outline/20">
                  <div className="flex items-center justify-between border-b border-outline/20 pb-4">
                    <h3 className="text-lg font-black text-onSurface">
                      {editingTaskId ? 'Edit Personal Task' : 'Create New Personal Task'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setTaskTypeStep(null)}
                      className="text-xs font-bold text-onSurfaceVariant hover:text-onSurface"
                    >
                      ← Back to choices
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-onSurface uppercase tracking-wider mb-1">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Complete Data Structures Lab Report"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full bg-white border border-outline/40 rounded-xl px-4 py-2.5 text-sm font-semibold text-onSurface focus:outline-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-onSurface uppercase tracking-wider mb-1">
                        Description / Objective
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Add specific instructions, notes, or classroom details..."
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        className="w-full bg-white border border-outline/40 rounded-xl px-4 py-2.5 text-sm text-onSurface focus:outline-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-onSurface uppercase tracking-wider mb-1">
                          Category
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full bg-white border border-outline/40 rounded-xl px-4 py-2.5 text-sm font-semibold text-onSurface focus:outline-primary"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-onSurface uppercase tracking-wider mb-1">
                          Priority Level
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800 border-blue-300' },
                            { id: 'medium', label: 'Medium', color: 'bg-orange-100 text-orange-800 border-orange-300' },
                            { id: 'high', label: 'High', color: 'bg-red-100 text-red-800 border-red-300' }
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setFormPriority(p.id)}
                              className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                                formPriority === p.id ? `${p.color} ring-2 ring-offset-1` : 'bg-white text-gray-600 border-gray-200'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-onSurface uppercase tracking-wider mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={formDueDate}
                          onChange={(e) => setFormDueDate(e.target.value)}
                          className="w-full bg-white border border-outline/40 rounded-xl px-4 py-2.5 text-sm text-onSurface focus:outline-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-onSurface uppercase tracking-wider mb-1">
                          Due Time
                        </label>
                        <input
                          type="time"
                          value={formDueTime}
                          onChange={(e) => setFormDueTime(e.target.value)}
                          className="w-full bg-white border border-outline/40 rounded-xl px-4 py-2.5 text-sm text-onSurface focus:outline-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-onSurface uppercase tracking-wider mb-1">
                          Smart Reminder
                        </label>
                        <select
                          value={formReminder}
                          onChange={(e) => setFormReminder(e.target.value)}
                          className="w-full bg-white border border-outline/40 rounded-xl px-4 py-2.5 text-sm text-onSurface focus:outline-primary"
                        >
                          <option value="15 mins before">15 mins before</option>
                          <option value="1 hour before">1 hour before</option>
                          <option value="1 day before">1 day before</option>
                          <option value="On due date">On due date</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-onSurface uppercase tracking-wider mb-1">
                          Task Color Accent
                        </label>
                        <div className="flex gap-2 items-center pt-1">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setFormColor(c.value)}
                              className={`w-7 h-7 rounded-full transition-transform ${
                                formColor === c.value ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''
                              }`}
                              style={{ backgroundColor: c.value }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-onSurface uppercase tracking-wider mb-1">
                        Optional Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Reference materials in Library Block, Room 204"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="w-full bg-white border border-outline/40 rounded-xl px-4 py-2.5 text-sm text-onSurface focus:outline-primary"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-outline/20">
                    <button
                      type="button"
                      onClick={() => { resetForm(); setTaskTypeStep(null); }}
                      className="px-5 py-2.5 rounded-full border border-outline/50 text-xs font-bold text-onSurfaceVariant hover:bg-slate-100"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-primary hover:bg-primaryHover text-white text-xs font-black shadow-md transition-all active:scale-[0.98]"
                    >
                      {editingTaskId ? 'Update Task' : 'Save Task'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: COLLEGE ACTIVITIES BROWSER */}
          {activeTab === 'activities' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-outline/20">
                <div>
                  <h3 className="text-base font-black text-onSurface">SCE PostgreSQL Activity Registry</h3>
                  <p className="text-xs text-onSurfaceVariant">Select any college event, club, workshop, or hackathon to instantly add to your tasks.</p>
                </div>
              </div>

              {loadingActivities ? (
                <ActivityManagerSkeleton />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activities.map((act) => {
                    const isAlreadyAdded = tasks.some(t => t.activity_id === act.id && t.activity_type === act.activity_type && !t.is_archived);
                    return (
                      <div
                        key={`${act.activity_type}-${act.id}`}
                        className="bg-white border border-outline/30 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full">
                              {act.category}
                            </span>
                            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">location_on</span>
                              {act.venue || 'Campus'}
                            </span>
                          </div>

                          <h4 className="text-sm font-extrabold text-onSurface leading-snug">{act.title}</h4>

                          {act.date && (
                            <p className="text-xs text-onSurfaceVariant mt-1 font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {new Date(act.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-outline/15 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                            Active Record
                          </span>

                          <button
                            type="button"
                            disabled={isAlreadyAdded}
                            onClick={() => handleAddCollegeActivity(act)}
                            className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 ${
                              isAlreadyAdded
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-primaryHover text-white shadow-xs'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {isAlreadyAdded ? 'check' : 'add'}
                            </span>
                            <span>{isAlreadyAdded ? 'In My Tasks' : 'Add to My Tasks'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3 & DEFAULT: TASKS LIST VIEW */}
          {(activeTab === 'all' || activeTab === 'completed' || activeTab === 'archived') && (
            <div className="space-y-6 animate-fade-in">
              {/* Filter and Search Bar */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-outline/20 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-72">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search tasks or notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-outline/30 rounded-full pl-9 pr-4 py-2 text-xs font-semibold text-onSurface focus:outline-primary"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="bg-white border border-outline/30 rounded-full px-3 py-1.5 text-xs font-semibold text-onSurface"
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>

                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-white border border-outline/30 rounded-full px-3 py-1.5 text-xs font-semibold text-onSurface"
                    >
                      <option value="all">All Categories</option>
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Task Cards List */}
              {loadingTasks ? (
                <ActivityManagerSkeleton />
              ) : displayedTasks.length === 0 ? (
                /* Feature 14: Empty State */
                <div className="text-center py-12 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-outline/30 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primaryContainer/40 text-primary flex items-center justify-center mx-auto text-3xl">
                    <span className="material-symbols-outlined text-[36px]">assignment_turned_in</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-onSurface">No activities yet.</h4>
                    <p className="text-xs text-onSurfaceVariant max-w-sm mx-auto mt-1">
                      Keep track of college events, club registrations, and personal study goals all in one place.
                    </p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('add'); resetForm(); }}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primaryHover text-white text-xs font-bold py-2.5 px-6 rounded-full shadow-md transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    <span>Create Your First Task</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedTasks.map((t) => {
                    const isDone = t.status === 'completed';
                    const isHigh = t.priority === 'high';
                    const isMed = t.priority === 'medium';
                    const isOverdue = t.status === 'overdue';

                    return (
                      <div
                        key={t.id}
                        className={`bg-white border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 hover:shadow-md ${
                          isDone ? 'opacity-65 bg-slate-50/80 border-slate-200' : 'border-outline/25'
                        }`}
                        style={{
                          borderLeft: `4px solid ${t.color || (isHigh ? '#DC2626' : isMed ? '#D97706' : '#1B4DA6')}`
                        }}
                      >
                        {/* Checkbox + Details */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            className="mt-0.5 text-slate-400 hover:text-primary transition-colors flex-shrink-0"
                            title={isDone ? "Mark as pending" : "Mark as completed"}
                          >
                            <span className={`material-symbols-outlined text-[24px] ${isDone ? 'text-emerald-600' : ''}`}>
                              {isDone ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                          </button>

                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className={`text-sm font-extrabold text-onSurface leading-snug ${isDone ? 'line-through text-slate-500' : ''}`}>
                                {t.title}
                              </h4>

                              {/* Priority Chip */}
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isHigh ? 'bg-red-100 text-red-700' : isMed ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {t.priority}
                              </span>

                              {/* Status Badge */}
                              {isOverdue && !isDone && (
                                <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                  Overdue
                                </span>
                              )}
                            </div>

                            {t.description && (
                              <p className="text-xs text-onSurfaceVariant leading-relaxed line-clamp-2">
                                {t.description}
                              </p>
                            )}

                            {/* Activity Deleted Notice */}
                            {t.activity_deleted && (
                              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md mt-1 border border-amber-200">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                <span>{t.activity_warning}</span>
                              </div>
                            )}

                            {/* Dates & Reminders */}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-onSurfaceVariant pt-1">
                              {t.category && (
                                <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                                  {t.category}
                                </span>
                              )}

                              {t.due_date && (
                                <span className="flex items-center gap-1 font-medium">
                                  <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                  {new Date(t.due_date).toLocaleDateString()} {t.due_time || ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                          {t.activity_type === 'club' && (
                            <button
                              onClick={() => { onClose(); navigate('/clubs'); }}
                              className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-full transition-all"
                            >
                              View Club
                            </button>
                          )}

                          <button
                            onClick={() => handleEditClick(t)}
                            className="p-1.5 hover:bg-slate-100 text-gray-500 hover:text-primary rounded-full transition-colors"
                            title="Edit task"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>

                          <button
                            onClick={() => handleDuplicate(t.id)}
                            className="p-1.5 hover:bg-slate-100 text-gray-500 hover:text-primary rounded-full transition-colors"
                            title="Duplicate task"
                          >
                            <span className="material-symbols-outlined text-[18px]">content_copy</span>
                          </button>

                          <button
                            onClick={() => handleArchive(t.id, t.is_archived)}
                            className="p-1.5 hover:bg-slate-100 text-gray-500 hover:text-primary rounded-full transition-colors"
                            title={t.is_archived ? "Restore task" : "Archive task"}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {t.is_archived ? 'unarchive' : 'archive'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-colors"
                            title="Delete task"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ActivityManagerModal;
