import React, { useState, useEffect } from 'react';
import { Home, Plus, Trash2, Edit, Users, MessageSquare, Info, ShieldCheck, X } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminHostel = () => {
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'mess' | 'wardens' | 'rooms'
  const [hostelData, setHostelData] = useState({ info: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [infoForm, setInfoForm] = useState({
    info_type: 'rules', // 'rules' | 'mess_menu' | 'warden' | 'emergency' | 'notice'
    title: '',
    content: ''
  });

  const [students, setStudents] = useState([]);
  const [roomForm, setRoomForm] = useState({
    student_id: '',
    room_number: '',
    block_name: 'Bose Hostels'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [hostelRes, studRes] = await Promise.all([
        fetch('/api/admin/hostel', { headers }),
        fetch('/api/admin/students', { headers })
      ]);

      if (hostelRes.ok) setHostelData(await hostelRes.json());
      if (studRes.ok) setStudents(await studRes.json());
    } catch (err) {
      console.error(err);
      setError('Failed to load hostel logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddInfo = (type) => {
    setSelectedItem(null);
    setInfoForm({
      info_type: type,
      title: '',
      content: ''
    });
    setShowModal(true);
  };

  const openEditInfo = (item) => {
    setSelectedItem(item);
    setInfoForm({
      info_type: item.info_type || 'rules',
      title: item.title || '',
      content: item.content || ''
    });
    setShowModal(true);
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('pm_admin_token');
    const method = selectedItem ? 'PUT' : 'POST';
    const url = selectedItem ? `/api/admin/hostel/info/${selectedItem.id}` : '/api/admin/hostel/info';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(infoForm)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const body = await res.json();
        setError(body.error || 'Failed to save hostel details');
      }
    } catch (err) {
      setError('Network error saving details');
    }
  };

  const handleInfoDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/hostel/info/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch('/api/admin/hostel/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roomForm)
      });
      if (res.ok) {
        setRoomForm({ student_id: '', room_number: '', block_name: 'Bose Hostels' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoomDelete = async (id) => {
    if (!window.confirm('Remove room allocation?')) return;
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/hostel/rooms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rulesList = hostelData.info.filter(i => i.info_type === 'rules');
  const messMenus = hostelData.info.filter(i => i.info_type === 'mess_menu');
  const wardens = hostelData.info.filter(i => i.info_type === 'warden');

  if (loading) {
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Hostel Control files...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-onSurface tracking-tight">Hostel Control Panel</h1>
        <p className="text-xs text-onSurfaceVariant font-medium">Manage rules, wardens directory, mess menu, and student room allocations.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline/10 gap-6 text-xs font-bold text-onSurfaceVariant">
        {[
          { id: 'rules', label: 'Rules & Handbooks', icon: ShieldCheck },
          { id: 'mess', label: 'Mess Menu', icon: Info },
          { id: 'wardens', label: 'Wardens Directory', icon: Users },
          { id: 'rooms', label: 'Room Allocations', icon: Home }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                isActive ? 'border-primary text-primary font-black' : 'border-transparent hover:text-onSurface'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-onSurface">Rules & Regulations</h2>
            <button onClick={() => openAddInfo('rules')} className="px-3 py-1.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-[11px] font-bold shadow-2xs cursor-pointer">
              Add Rule List
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rulesList.map(r => (
              <div key={r.id} className="bg-surface border border-outline/15 rounded-3xl p-5 shadow-2xs flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-onSurface text-sm">{r.title}</h3>
                  <p className="text-xs text-onSurfaceVariant/90 leading-relaxed mt-2 whitespace-pre-line">{r.content}</p>
                </div>
                <div className="flex justify-end gap-1.5 pt-3 border-t border-outline/10">
                  <button onClick={() => openEditInfo(r)} className="p-1 text-primary hover:bg-slate-100 rounded cursor-pointer"><Edit size={14} /></button>
                  <button onClick={() => handleInfoDelete(r.id)} className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mess' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-onSurface">Weekly Mess Menu schedules</h2>
            <button onClick={() => openAddInfo('mess_menu')} className="px-3 py-1.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-[11px] font-bold shadow-2xs cursor-pointer">
              Add Mess Schedule
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {messMenus.map(m => (
              <div key={m.id} className="bg-surface border border-outline/15 rounded-3xl p-5 shadow-2xs flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-onSurface text-sm">{m.title}</h3>
                  <p className="text-xs text-onSurfaceVariant/90 leading-relaxed mt-2 whitespace-pre-line">{m.content}</p>
                </div>
                <div className="flex justify-end gap-1.5 pt-3 border-t border-outline/10">
                  <button onClick={() => openEditInfo(m)} className="p-1 text-primary hover:bg-slate-100 rounded cursor-pointer"><Edit size={14} /></button>
                  <button onClick={() => handleInfoDelete(m.id)} className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'wardens' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-onSurface">Hostel Wardens directory</h2>
            <button onClick={() => openAddInfo('warden')} className="px-3 py-1.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-[11px] font-bold shadow-2xs cursor-pointer">
              Add Warden
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wardens.map(w => (
              <div key={w.id} className="bg-surface border border-outline/15 rounded-3xl p-5 shadow-2xs flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-onSurface text-sm">{w.title}</h3>
                  <p className="text-xs text-onSurfaceVariant/90 leading-relaxed mt-2 whitespace-pre-line">{w.content}</p>
                </div>
                <div className="flex justify-end gap-1.5 pt-3 border-t border-outline/10">
                  <button onClick={() => openEditInfo(w)} className="p-1 text-primary hover:bg-slate-100 rounded cursor-pointer"><Edit size={14} /></button>
                  <button onClick={() => handleInfoDelete(w.id)} className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-surface border border-outline/25 rounded-3xl p-5 shadow-2xs">
            <h2 className="text-xs font-black uppercase text-onSurfaceVariant mb-3">Allocate New Room</h2>
            <form onSubmit={handleRoomSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/80 mb-1">Select Student</label>
                <select
                  required
                  value={roomForm.student_id}
                  onChange={(e) => setRoomForm({ ...roomForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface font-semibold"
                >
                  <option value="">Choose...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/80 mb-1">Room No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 204B"
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/80 mb-1">Block Name</label>
                  <input
                    type="text"
                    required
                    value={roomForm.block_name}
                    onChange={(e) => setRoomForm({ ...roomForm, block_name: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-primaryHover transition-colors cursor-pointer pt-2 mt-2">
                Allocate Room
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-surface border border-outline/20 rounded-3xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-outline/10 text-[10px] font-black uppercase text-onSurfaceVariant/80 tracking-wider">
                <tr>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Room No</th>
                  <th className="px-5 py-3">Block Name</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10 font-semibold text-onSurface">
                {hostelData.rooms.map(room => (
                  <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">{room.student_name}</td>
                    <td className="px-5 py-3">{room.room_number}</td>
                    <td className="px-5 py-3">{room.block_name}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleRoomDelete(room.id)} className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hostelData.rooms.length === 0 && (
              <p className="text-center text-xs text-onSurfaceVariant/60 py-12 italic">No students allocated to rooms yet.</p>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl overflow-hidden border border-outline/10">
            <div className="px-6 py-5 bg-primary text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">{selectedItem ? 'Edit Info' : 'Add Info'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleInfoSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mess Menu (Boys Hostel)"
                  value={infoForm.title}
                  onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Content Body</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Insert bullet points or details..."
                  value={infoForm.content}
                  onChange={(e) => setInfoForm({ ...infoForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface resize-none"
                />
              </div>

              <div className="pt-4 border-t border-outline/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline/30 hover:bg-slate-50 rounded-xl text-xs font-bold text-onSurfaceVariant transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-colors cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHostel;
