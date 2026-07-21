import React, { useState, useEffect } from 'react';
import { Database, FileText, Upload, RefreshCw, Trash2, CheckCircle, AlertCircle, Plus, Edit, HelpCircle, Check, X, BookOpen } from 'lucide-react';
import { safeFetchJson } from '../utils/api';

const AdminKnowledge = () => {
  const [activeTab, setActiveTab] = useState('faqs'); // 'faqs' | 'unknown' | 'documents'
  
  // Data states
  const [faqs, setFaqs] = useState([]);
  const [unknownQuestions, setUnknownQuestions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'General', is_approved: true });

  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedUnknown, setSelectedUnknown] = useState(null);
  const [answerText, setAnswerText] = useState('');

  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('pdf');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFaqs = async () => {
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson('/api/admin/knowledge/faqs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && Array.isArray(res.data)) {
        setFaqs(res.data);
      } else {
        setFaqs([]);
      }
    } catch (e) {
      console.error("Failed to fetch FAQs:", e);
      setFaqs([]);
    }
  };

  const fetchUnknownQuestions = async () => {
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson('/api/admin/knowledge/unknown-questions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && Array.isArray(res.data)) {
        setUnknownQuestions(res.data);
      } else {
        setUnknownQuestions([]);
      }
    } catch (e) {
      console.error("Failed to fetch unknown questions:", e);
      setUnknownQuestions([]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson('/api/admin/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && Array.isArray(res.data)) {
        setDocuments(res.data);
      } else {
        setDocuments([]);
      }
    } catch (e) {
      console.error("Failed to fetch documents:", e);
      setDocuments([]);
    }
  };

  const reloadData = async () => {
    setLoading(true);
    await Promise.all([fetchFaqs(), fetchUnknownQuestions(), fetchDocuments()]);
    setLoading(false);
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const method = selectedFaq ? 'PUT' : 'POST';
      const url = selectedFaq ? `/api/admin/knowledge/faqs/${selectedFaq.id}` : '/api/admin/knowledge/faqs';

      const res = await safeFetchJson(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(faqForm)
      });

      if (!res.ok) {
        alert(res.error || 'Failed to save FAQ');
        return;
      }

      setShowFaqModal(false);
      setSelectedFaq(null);
      setFaqForm({ question: '', answer: '', category: 'General', is_approved: true });
      fetchFaqs();
    } catch (e) {
      alert('An unexpected error occurred while saving FAQ.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/knowledge/faqs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFaqs();
      else alert(res.error || 'Failed to delete FAQ');
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveUnknown = async (e) => {
    e.preventDefault();
    if (!selectedUnknown || !answerText) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/knowledge/unknown-questions/${selectedUnknown.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer: answerText, category: 'General' })
      });

      if (!res.ok) {
        alert(res.error || 'Failed to approve question.');
        return;
      }

      setShowAnswerModal(false);
      setSelectedUnknown(null);
      setAnswerText('');
      fetchFaqs();
      fetchUnknownQuestions();
    } catch (e) {
      alert('An unexpected error occurred while approving question.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newDocTitle, type: newDocType })
      });
      if (res.ok) {
        setNewDocTitle('');
        fetchDocuments();
      } else {
        alert(res.error || 'Failed to upload document.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm("Delete this knowledge document?")) return;
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchDocuments();
      else alert(res.error || 'Failed to delete document');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">AI Knowledge Base & FAQs</h1>
          <p className="text-xs text-onSurfaceVariant font-medium mt-1">
            Ground-truth dataset powering the Student AI Chatbot and Instant FAQ answers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedFaq(null);
              setFaqForm({ question: '', answer: '', category: 'General', is_approved: true });
              setShowFaqModal(true);
            }}
            className="bg-primary hover:bg-primaryHover text-onPrimary font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add New FAQ</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline/20 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('faqs')}
          className={`pb-3 transition-colors ${activeTab === 'faqs' ? 'border-b-2 border-primary text-primary' : 'text-onSurfaceVariant hover:text-onSurface'}`}
        >
          Structured FAQs ({faqs.length})
        </button>
        <button
          onClick={() => setActiveTab('unknown')}
          className={`pb-3 transition-colors flex items-center gap-2 ${activeTab === 'unknown' ? 'border-b-2 border-primary text-primary' : 'text-onSurfaceVariant hover:text-onSurface'}`}
        >
          <span>Unanswered AI Questions</span>
          {unknownQuestions.filter(q => q.status === 'pending').length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
              {unknownQuestions.filter(q => q.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 transition-colors ${activeTab === 'documents' ? 'border-b-2 border-primary text-primary' : 'text-onSurfaceVariant hover:text-onSurface'}`}
        >
          Knowledge Documents ({documents.length})
        </button>
      </div>

      {/* TAB 1: STRUCTURED FAQS */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-onSurfaceVariant">Loading FAQs from PostgreSQL...</div>
          ) : faqs.length === 0 ? (
            <div className="py-12 text-center text-xs text-onSurfaceVariant italic">No FAQs configured yet. Click "Add New FAQ" to create one.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-surface border border-surfaceVariant/60 rounded-2xl p-5 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-primaryContainer text-onPrimaryContainer uppercase tracking-wider">
                        {faq.category || 'General'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> Approved Grounding
                      </span>
                    </div>
                    <h4 className="font-bold text-onSurface text-sm leading-snug">{faq.question}</h4>
                    <p className="text-xs text-onSurfaceVariant mt-2 leading-relaxed bg-surfaceContainerLow/60 p-3 rounded-xl border border-outline/10">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="flex justify-end items-center gap-2 pt-2 border-t border-outline/10">
                    <button
                      onClick={() => {
                        setSelectedFaq(faq);
                        setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category || 'General', is_approved: faq.is_approved });
                        setShowFaqModal(true);
                      }}
                      className="p-1.5 text-onSurfaceVariant hover:text-primary rounded-lg hover:bg-surfaceVariant transition-colors"
                      title="Edit FAQ"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1.5 text-onSurfaceVariant hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete FAQ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UNANSWERED AI QUESTIONS */}
      {activeTab === 'unknown' && (
        <div className="space-y-4">
          <div className="bg-surface border border-surfaceVariant/60 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-surfaceContainerHigh text-onSurfaceVariant font-extrabold uppercase tracking-wider border-b border-outline/20">
                <tr>
                  <th className="px-5 py-3.5">Student Question</th>
                  <th className="px-5 py-3.5">Asked By</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/15 font-medium">
                {unknownQuestions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-onSurfaceVariant italic">
                      No unanswered student questions currently pending review.
                    </td>
                  </tr>
                ) : (
                  unknownQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-surfaceContainerLow/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-onSurface">{q.question}</td>
                      <td className="px-5 py-3.5 text-onSurfaceVariant">{q.student_name || 'Anonymous Student'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${q.status === 'answered' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-onSurfaceVariant">
                        {new Date(q.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {q.status === 'pending' && (
                          <button
                            onClick={() => { setSelectedUnknown(q); setAnswerText(''); setShowAnswerModal(true); }}
                            className="bg-primary text-onPrimary font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs hover:bg-primaryHover transition-all"
                          >
                            Approve & Answer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-onSurface">Index Knowledge File</h3>
            <form onSubmit={handleDocUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Document Title</label>
                <input type="text" required value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} placeholder="e.g. Saranathan Academic Regulation 2026" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Document Type</label>
                <select value={newDocType} onChange={e => setNewDocType(e.target.value)} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                  <option value="pdf">PDF Handbook</option>
                  <option value="circular">Official Circular</option>
                  <option value="notice">Department Notice</option>
                  <option value="syllabus">Syllabus / Curriculum</option>
                </select>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full bg-primary text-onPrimary font-bold py-3 rounded-xl shadow-md">
                {actionLoading ? 'Indexing...' : 'Upload & Index to AI'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-onSurface mb-4">Indexed Vector Documents</h3>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3.5 bg-surfaceContainerLow/60 rounded-2xl border border-outline/20">
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-primary" />
                    <div>
                      <h4 className="font-bold text-onSurface text-xs">{doc.title}</h4>
                      <p className="text-[10px] text-onSurfaceVariant">Type: {doc.type.toUpperCase()} • Indexed: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQ MODAL */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-lg w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowFaqModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant"><X size={18} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1">{selectedFaq ? 'Edit FAQ' : 'Add FAQ'}</h3>
            <form onSubmit={handleFaqSubmit} className="space-y-3 text-xs mt-4">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Category</label>
                <select value={faqForm.category} onChange={e => setFaqForm({...faqForm, category: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                  <option value="General">General</option>
                  <option value="Clubs & Events">Clubs & Events</option>
                  <option value="Campus & Wayfinding">Campus & Wayfinding</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Mentorship">Mentorship</option>
                  <option value="Academics">Academics</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Question</label>
                <input type="text" required value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} placeholder="Question text..." className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Answer</label>
                <textarea required rows={4} value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} placeholder="Grounding answer text..." className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowFaqModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary text-onPrimary font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Saving...' : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE UNKNOWN QUESTION MODAL */}
      {showAnswerModal && selectedUnknown && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-lg w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowAnswerModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant"><X size={18} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1">Answer Student Question</h3>
            <p className="text-xs text-onSurfaceVariant mb-3">Question: "{selectedUnknown.question}"</p>

            <form onSubmit={handleApproveUnknown} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Official Answer</label>
                <textarea required rows={4} value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Provide official answer..." className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAnswerModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Approving...' : 'Approve & Save to FAQs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminKnowledge;
