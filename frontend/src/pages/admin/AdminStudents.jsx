import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, BookOpen, Plus, Key, Lock, CheckCircle, Ban, Trash2, Edit, X, RefreshCw, Shield } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    register_number: '',
    username: '',
    email: '',
    email_verified: true,
    department: 'Computer Science & Engineering',
    password: '',
    stay_type: 'day_scholar',
    hostel_block: '',
    status: 'active',
    role: 'student',
    gender: 'Male',
    travel_mode: 'own_transport'
  });
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (emailVerifiedFilter !== 'all') params.append('email_verified', emailVerifiedFilter);

      const res = await safeFetchJson(`/api/admin/students?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && Array.isArray(res.data)) {
        setStudents(res.data);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, statusFilter, emailVerifiedFilter]);

  const exportToCSV = () => {
    if (!students || students.length === 0) {
      alert("No student data available to export.");
      return;
    }
    const headers = ['Full Name', 'Username', 'Email', 'Email Status', 'Register Number', 'Department', 'Stay Type', 'Hostel Block', 'Gender', 'Travel Mode', 'Status', 'Role', 'Created At'];
    const rows = students.map(student => [
      student.full_name || student.name || '',
      `@${student.username}`,
      student.email || '',
      student.email_verified ? 'Verified' : 'Pending',
      student.register_number || student.roll_number || 'N/A',
      student.department_name || 'General Engineering',
      student.stay_type || 'day_scholar',
      student.hostel_block || '',
      student.gender || 'Male',
      student.travel_mode || 'own_transport',
      student.status || 'active',
      student.role || 'student',
      student.created_at ? new Date(student.created_at).toLocaleString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `students_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to create student account.');
        return;
      }

      setShowAddModal(false);
      setFormData({ full_name: '', register_number: '', username: '', email: '', email_verified: true, department: 'Computer Science & Engineering', password: '', stay_type: 'day_scholar', hostel_block: '', status: 'active', role: 'student', gender: 'Male', travel_mode: 'own_transport' });
      fetchStudents();
    } catch (err) {
      setErrorMsg('An unexpected error occurred while creating student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!formData.full_name || !formData.username) {
      setErrorMsg('Full Name and Username are required.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to update student profile.');
        return;
      }

      setShowEditModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      setErrorMsg('An unexpected error occurred while updating student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !newPassword) return;
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/students/${selectedStudent.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to reset password.');
        return;
      }

      setShowResetModal(false);
      setNewPassword('');
      setSelectedStudent(null);
    } catch (err) {
      setErrorMsg('An unexpected error occurred while resetting password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/students/${selectedStudent.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert(res.error || 'Failed to delete student.');
        return;
      }

      setShowDeleteModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      alert('An unexpected error occurred while deleting student.');
    } finally {
      setActionLoading(false);
    }
  };
  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      full_name: student.full_name || student.name || '',
      register_number: student.register_number || student.roll_number || '',
      username: student.username || '',
      email: student.email || '',
      email_verified: student.email_verified || false,
      department: student.department_name || 'Computer Science & Engineering',
      password: '',
      stay_type: student.stay_type || 'day_scholar',
      hostel_block: student.hostel_block || '',
      status: student.status || 'active',
      role: student.role || 'student',
      gender: student.gender || 'Male',
      travel_mode: student.travel_mode || 'own_transport'
    });
    setErrorMsg('');
    setShowEditModal(true);
  };
  return (
    <div className="space-y-6 text-left">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Student Management</h1>
          <p className="text-xs text-onSurfaceVariant font-medium mt-1">
            Real-time PostgreSQL student roster, authentication status, and security controls.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToCSV}
            className="border border-outline/30 hover:bg-slate-100 text-primary font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-1.5 bg-surface active:scale-[0.98]"
          >
            <RefreshCw size={14} />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={() => {
              setFormData({ full_name: '', register_number: '', username: '', email: '', email_verified: true, department: 'Computer Science & Engineering', password: '', stay_type: 'day_scholar', hostel_block: '', status: 'active', role: 'student', gender: 'Male', travel_mode: 'own_transport' });
              setErrorMsg('');
              setShowAddModal(true);
            }}
            className="bg-primary hover:bg-primaryHover text-onPrimary font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {/* Controls Bar (Search & Filter) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface border border-surfaceVariant/60 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-2.5 text-onSurfaceVariant/60" />
          <input
            type="text"
            placeholder="Search by name, register #, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline/30 rounded-xl text-xs bg-surfaceContainerLow focus:bg-white focus:border-primary outline-none text-onSurface font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <Filter size={15} className="text-onSurfaceVariant" />
            <span className="text-xs font-bold text-onSurfaceVariant">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface border border-outline/30 rounded-xl px-2.5 py-1.5 text-xs font-bold text-onSurface outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Mail size={15} className="text-onSurfaceVariant" />
            <span className="text-xs font-bold text-onSurfaceVariant">Email:</span>
            <select
              value={emailVerifiedFilter}
              onChange={(e) => setEmailVerifiedFilter(e.target.value)}
              className="bg-surface border border-outline/30 rounded-xl px-2.5 py-1.5 text-xs font-bold text-onSurface outline-none cursor-pointer"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Container */}
      {loading ? (
        <div className="bg-surface border border-surfaceVariant/60 rounded-3xl p-12 text-center text-onSurfaceVariant font-semibold">
          <div className="flex justify-center items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            <span>Querying PostgreSQL Users Table...</span>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-surface border border-surfaceVariant/60 rounded-3xl p-12 text-center text-onSurfaceVariant italic">
          No student records found in PostgreSQL matching criteria.
        </div>
      ) : (
        <>
          {/* Mobile Stacked Card List (< 640px) */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {students.map((student) => {
              let statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
              if (student.status === 'blocked') statusBadge = "bg-rose-100 text-rose-800 border-rose-300";
              else if (student.status === 'inactive') statusBadge = "bg-amber-100 text-amber-800 border-amber-300";

              return (
                <div key={student.id} className="bg-white border border-surfaceVariant/60 rounded-2xl p-4 space-y-3.5 shadow-sm text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primaryContainer text-onPrimaryContainer font-black flex items-center justify-center text-sm shrink-0">
                      {student.full_name ? student.full_name.charAt(0) : 'S'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-onSurface text-sm truncate">{student.full_name || student.name}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-onSurfaceVariant font-mono truncate">{student.email || `${student.username}@saranathan.ac.in`}</span>
                        {student.email_verified ? (
                          <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1 font-extrabold uppercase">Verified</span>
                        ) : (
                          <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1 font-extrabold uppercase">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-outline/5">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-onSurfaceVariant/60">Register #</span>
                      <span className="font-mono font-bold text-onSurface">{student.register_number || student.roll_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-onSurfaceVariant/60">Role</span>
                      <span className="font-bold text-onSurface capitalize">{student.role || 'student'}</span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="block text-[9px] uppercase font-bold text-onSurfaceVariant/60">Department</span>
                      <span className="font-semibold text-onSurface">{student.department_name || 'General Engineering'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline/5 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${statusBadge}`}>
                      {student.status || 'active'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(student)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-onSurfaceVariant hover:text-primary transition-colors"
                        title="Edit Student"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => { setSelectedStudent(student); setNewPassword(''); setErrorMsg(''); setShowResetModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-onSurfaceVariant hover:text-amber-700 transition-colors"
                        title="Reset Password"
                      >
                        <Key size={14} />
                      </button>
                      <button
                        onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-onSurfaceVariant hover:text-rose-700 transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block bg-surface border border-surfaceVariant/60 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surfaceContainerHigh text-onSurfaceVariant font-extrabold uppercase tracking-wider border-b border-outline/20">
                  <tr>
                    <th className="px-5 py-3.5">Student Details</th>
                    <th className="px-5 py-3.5">Email Status</th>
                    <th className="px-5 py-3.5">Register #</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/15 font-medium">
                  {students.map((student) => {
                    let statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
                    if (student.status === 'blocked') statusBadge = "bg-rose-100 text-rose-800 border-rose-300";
                    else if (student.status === 'inactive') statusBadge = "bg-amber-100 text-amber-800 border-amber-300";

                    return (
                      <tr key={student.id} className="hover:bg-surfaceContainerLow/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-primaryContainer text-onPrimaryContainer font-black flex items-center justify-center text-sm shadow-2xs">
                              {student.full_name ? student.full_name.charAt(0) : 'S'}
                            </div>
                            <div>
                              <p className="font-bold text-onSurface text-sm">{student.full_name || student.name}</p>
                              <p className="text-[10px] text-onSurfaceVariant font-mono">@{student.username}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-mono">
                          <div className="flex flex-col">
                            <span className="text-onSurface font-semibold text-xs">{student.email || '—'}</span>
                            <div className="mt-1">
                              {student.email_verified ? (
                                <span className="inline-flex items-center gap-0.5 text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.2 font-black uppercase">
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[8px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.2 font-black uppercase">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-mono font-bold text-onSurface">
                          {student.register_number || student.roll_number || 'N/A'}
                        </td>

                        <td className="px-5 py-3.5 text-onSurface font-semibold">
                          {student.department_name || 'General Engineering'}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${statusBadge}`}>
                            {student.status || 'active'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 font-bold text-onSurfaceVariant capitalize">
                          {student.role || 'student'}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(student)}
                              className="p-1.5 rounded-lg hover:bg-surfaceVariant text-onSurfaceVariant hover:text-primary transition-colors"
                              title="Edit Student"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => { setSelectedStudent(student); setNewPassword(''); setErrorMsg(''); setShowResetModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-amber-100 text-onSurfaceVariant hover:text-amber-700 transition-colors"
                              title="Reset Password"
                            >
                              <Key size={16} />
                            </button>
                            <button
                              onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-rose-100 text-onSurfaceVariant hover:text-rose-700 transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-lg w-full p-6 text-left shadow-2xl relative animate-scale-up">
            
            <button onClick={() => setShowAddModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant hover:text-onSurface p-1 rounded-full">
              <X size={18} />
            </button>

            <h3 className="text-xl font-black text-onSurface mb-1">Create Student Profile</h3>
            <p className="text-xs text-onSurfaceVariant mb-4">Adds student directly to PostgreSQL database & official registry.</p>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-bold mb-3">{errorMsg}</p>}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Full Name</label>
                <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="e.g. Aravind Swaminathan" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Register Number (Optional)</label>
                  <input type="text" value={formData.register_number} onChange={e => setFormData({...formData, register_number: e.target.value})} placeholder="SCE2025CSE001" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-mono" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Username</label>
                  <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="aravind_sce" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Email Address</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. student@gmail.com" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Email Verification</label>
                  <select value={formData.email_verified} onChange={e => setFormData({...formData, email_verified: e.target.value === 'true'})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-semibold">
                    <option value="true">Verified</option>
                    <option value="false">Pending</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Department</label>
                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-semibold">
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Computer Science & Engineering (Artificial Intelligence and Machine Learning)">Computer Science & Engineering (Artificial Intelligence and Machine Learning)</option>
                    <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                    <option value="Computer Science and Business Systems">Computer Science and Business Systems</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                    <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                    <option value="Instrumentation & Control Engineering">Instrumentation & Control Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Gender</label>
                  <select value={formData.gender || 'Male'} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-semibold">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Stay Type</label>
                  <select value={formData.stay_type} onChange={e => {
                    const nextStay = e.target.value;
                    setFormData({
                      ...formData,
                      stay_type: nextStay,
                      travel_mode: nextStay === 'hostel' ? 'own_transport' : formData.travel_mode,
                      hostel_block: nextStay === 'hostel' ? (formData.gender === 'Female' ? 'Girls Hostel' : 'Boys Hostel') : ''
                    });
                  }} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                    <option value="day_scholar">Day Scholar</option>
                    <option value="hostel">Hosteller</option>
                  </select>
                </div>
                <div>
                  {formData.stay_type === 'hostel' ? (
                    <>
                      <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Hostel Block</label>
                      <select value={formData.hostel_block || ''} onChange={e => setFormData({...formData, hostel_block: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-semibold">
                        <option value="">-- No Hostel Block --</option>
                        {formData.gender === 'Female' ? (
                          <option value="Girls Hostel">Girls Hostel</option>
                        ) : (
                          <option value="Boys Hostel">Boys Hostel</option>
                        )}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Travel Mode</label>
                      <select value={formData.travel_mode || 'own_transport'} onChange={e => setFormData({...formData, travel_mode: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-semibold">
                        <option value="own_transport">Out Bus / Own Vehicle</option>
                        <option value="college_bus">College Bus</option>
                      </select>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Initial Password</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Password@123" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary text-onPrimary font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Saving...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-lg w-full p-6 text-left shadow-2xl relative animate-scale-up">
            
            <button onClick={() => setShowEditModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant hover:text-onSurface p-1 rounded-full">
              <X size={18} />
            </button>

            <h3 className="text-xl font-black text-onSurface mb-1">Edit Student Profile</h3>
            <p className="text-xs text-onSurfaceVariant mb-4">Update status, role, and department in PostgreSQL.</p>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-bold mb-3">{errorMsg}</p>}

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Full Name</label>
                <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Register Number (Optional)</label>
                  <input type="text" value={formData.register_number} onChange={e => setFormData({...formData, register_number: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-mono" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Username</label>
                  <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Email Address</label>
                  <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Email Verification</label>
                  <select value={formData.email_verified} onChange={e => setFormData({...formData, email_verified: e.target.value === 'true'})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-semibold">
                    <option value="true">Verified</option>
                    <option value="false">Pending</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Department</label>
                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-semibold">
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Computer Science & Engineering (Artificial Intelligence and Machine Learning)">Computer Science & Engineering (Artificial Intelligence and Machine Learning)</option>
                    <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                    <option value="Computer Science and Business Systems">Computer Science and Business Systems</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                    <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                    <option value="Instrumentation & Control Engineering">Instrumentation & Control Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Gender</label>
                  <select value={formData.gender || 'Male'} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-semibold">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Stay Type</label>
                  <select value={formData.stay_type} onChange={e => {
                    const nextStay = e.target.value;
                    setFormData({
                      ...formData,
                      stay_type: nextStay,
                      travel_mode: nextStay === 'hostel' ? 'own_transport' : formData.travel_mode,
                      hostel_block: nextStay === 'hostel' ? (formData.gender === 'Female' ? 'Girls Hostel' : 'Boys Hostel') : ''
                    });
                  }} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                    <option value="day_scholar">Day Scholar</option>
                    <option value="hostel">Hosteller</option>
                  </select>
                </div>
                <div>
                  {formData.stay_type === 'hostel' ? (
                    <>
                      <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Hostel Block</label>
                      <select value={formData.hostel_block || ''} onChange={e => setFormData({...formData, hostel_block: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-semibold">
                        <option value="">-- No Hostel Block --</option>
                        {formData.gender === 'Female' ? (
                          <option value="Girls Hostel">Girls Hostel</option>
                        ) : (
                          <option value="Boys Hostel">Boys Hostel</option>
                        )}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Travel Mode</label>
                      <select value={formData.travel_mode || 'own_transport'} onChange={e => setFormData({...formData, travel_mode: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-semibold">
                        <option value="own_transport">Out Bus / Own Vehicle</option>
                        <option value="college_bus">College Bus</option>
                      </select>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Account Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary text-onPrimary font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-md w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowResetModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant"><X size={18} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1">Reset Password</h3>
            <p className="text-xs text-onSurfaceVariant mb-4">Reset password for {selectedStudent.full_name} ({selectedStudent.username}).</p>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-bold mb-3">{errorMsg}</p>}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">New Password</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowResetModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-md w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <h3 className="text-xl font-black text-rose-700 mb-2">Delete Student Record</h3>
            <p className="text-xs text-onSurfaceVariant leading-relaxed mb-6">
              Are you sure you want to permanently delete student <strong>{selectedStudent.full_name}</strong> ({selectedStudent.register_number})? This will remove all database preferences and checklist data.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
              <button onClick={handleDeleteSubmit} disabled={actionLoading} className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl shadow-md">
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminStudents;
