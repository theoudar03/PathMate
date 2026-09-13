import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Mail, Send, CheckCircle2, AlertCircle, HelpCircle, MessageSquare, LifeBuoy, MapPin, Sparkles } from 'lucide-react';

const CATEGORIES = [
  'Suggestion',
  'Report incorrect information',
  'Report campus map mistake',
  'Report club or event issue',
  'Report technical issue',
  'Account or login problem',
  'General enquiry'
];

const Contact = () => {
  const { user, showNotification } = useApp();

  const [name, setName] = useState(user?.full_name || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState('General enquiry');
  const [pageReference, setPageReference] = useState('');
  const [message, setMessage] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name || name.trim().length < 2) {
      errs.name = 'Please provide your full name.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }
    if (!category || !CATEGORIES.includes(category)) {
      errs.category = 'Please select a valid category.';
    }
    if (!message || message.trim().length < 10) {
      errs.message = 'Please provide a message of at least 10 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
          page_reference: pageReference.trim() || null,
          user_id: user?.id || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit contact request.');
      }

      setSubmittedRequest(data.request);
      showNotification('Your contact request has been received by campus administration!', 'success');
      setMessage('');
      setPageReference('');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectEmail = () => {
    const subject = encodeURIComponent(`PathMate Contact Inquiry - [${category}]`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nCategory: ${category}\nPage Ref: ${pageReference}\n\nMessage:\n${message}`);
    window.location.href = `mailto:pathmate-sce@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-8 font-sans text-left max-w-5xl mx-auto py-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-indigo-900 text-white rounded-[28px] p-7 md:p-10 shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20 blur-2xl pointer-events-none" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
          <LifeBuoy size={14} />
          <span>Support & Enquiries</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Contact PathMate Team</h1>
        <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed max-w-xl">
          Have a suggestion, spot a campus map discrepancy, or need assistance? Reach out directly to the Saranathan College of Engineering PathMate administrative desk.
        </p>
      </div>

      {/* Main Grid: Official Contact Email Card + Contact Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Official Contact Card */}
        <div className="space-y-6">
          <div className="bg-white border border-outline/40 rounded-[24px] p-6 text-left space-y-5 shadow-elevation1">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center flex-shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Support</span>
                <h3 className="text-base font-black text-slate-800 tracking-tight">PathMate Help Desk</h3>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Official Email Address:</span>
              <a
                href="mailto:pathmate-sce@gmail.com"
                className="block text-sm font-extrabold text-primary hover:underline bg-blue-50/70 border border-blue-100 p-3 rounded-2xl break-all transition-colors"
              >
                pathmate-sce@gmail.com
              </a>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleDirectEmail}
                className="w-full bg-white border-2 border-primary text-primary hover:bg-primary/5 font-extrabold text-xs py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Mail size={16} />
                <span>Email Support Directly</span>
              </button>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
              <p className="flex items-center gap-2">
                <MapPin size={15} className="text-primary flex-shrink-0" />
                <span>Panjappur, Tiruchirappalli — 620012</span>
              </p>
              <p className="flex items-center gap-2">
                <Sparkles size={15} className="text-amber-500 flex-shrink-0" />
                <span>Responses processed within 24-48 business hours.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-outline/40 rounded-[24px] p-6 sm:p-8 text-left space-y-6 shadow-elevation1">
            
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Send Us a Message</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Fill out the details below to log a database-tracked support ticket with campus administration.
              </p>
            </div>

            {submittedRequest ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-6 text-left space-y-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Request Submitted Successfully</h3>
                    <p className="text-xs font-semibold text-emerald-700">Request ID: #{submittedRequest.id}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-emerald-800 bg-white/80 p-4 rounded-xl border border-emerald-100">
                  <p><strong>Category:</strong> {submittedRequest.category}</p>
                  <p><strong>Status:</strong> <span className="font-extrabold text-emerald-700 uppercase">{submittedRequest.status}</span></p>
                  <p><strong>Timestamp:</strong> {new Date(submittedRequest.created_at).toLocaleString()}</p>
                  <p className="pt-1"><strong>Your Message:</strong> "{submittedRequest.message}"</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSubmittedRequest(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-full transition-all cursor-pointer"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    {errors.name && <p className="text-[11px] text-red-600 font-semibold">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Your Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@saranathan.ac.in"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    {errors.email && <p className="text-[11px] text-red-600 font-semibold">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Page Reference */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Page / Feature Reference <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={pageReference}
                      onChange={(e) => setPageReference(e.target.value)}
                      placeholder="e.g. /map, /clubs, Dashboard"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Message Details
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your suggestion, technical issue, or campus enquiry in detail..."
                    rows={4}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                  {errors.message && <p className="text-[11px] text-red-600 font-semibold">{errors.message}</p>}
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primaryHover text-white font-extrabold text-xs py-3 px-8 rounded-full shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                  >
                    {submitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit Contact Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
