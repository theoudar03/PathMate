import React, { useEffect } from 'react';
import './FloatingNotice.css';
import { X, Download, Share2, Bookmark, Check, Calendar, User, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const FloatingNotice = ({ notice, onClose }) => {
  // Disable body scroll when notice is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!notice) return null;

  // Determine Priority Colors
  let priorityBg = 'bg-blue-100';
  let priorityText = 'text-blue-700';
  if (notice.priority === 'urgent') {
    priorityBg = 'bg-red-100';
    priorityText = 'text-red-700';
  } else if (notice.priority === 'high') {
    priorityBg = 'bg-orange-100';
    priorityText = 'text-orange-700';
  }

  // Handle Swipe Down on Mobile (Simple implementation)
  let touchStartY = 0;
  const handleTouchStart = (e) => {
    touchStartY = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - touchStartY > 100) {
      onClose(); // Swipe down detected
    }
  };

  return (
    <div className="floating-notice-overlay" onClick={onClose}>
      <div 
        className="floating-notice-paper" 
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        
        {/* Header Section */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black tracking-tighter">
              PM
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Saranathan College</p>
              <p className="text-sm font-semibold text-gray-800">Official Circular</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Close Notice"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="floating-notice-content">
          <div className="mb-6 flex gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${priorityBg} ${priorityText}`}>
              {notice.priority === 'urgent' ? 'High Priority' : notice.priority === 'high' ? 'Medium Priority' : 'Notice'}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
              {notice.target_audience || notice.target || 'All Students'}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
            {notice.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-dashed border-gray-200">
            <div className="flex items-center gap-1.5">
              <Calendar size={16} />
              <span>{new Date(notice.created_at || notice.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User size={16} />
              <span>{notice.author || 'Administration'}</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="notice-prose text-gray-800 text-base leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {notice.content}
            </ReactMarkdown>
            
            {notice.attachment_url && (
              <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <img src={notice.attachment_url} alt="Notice Attachment" className="w-full h-auto object-contain" />
              </div>
            )}
          </div>

          {/* Dummy Attachments Area */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">attachment</span>
              Attachments
            </h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors w-full sm:w-auto">
                <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                </div>
                <div className="flex-1 pr-4">
                  <p className="text-sm font-semibold text-gray-800">Notice_Document.pdf</p>
                  <p className="text-xs text-gray-500">245 KB</p>
                </div>
                <Download size={18} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center flex-wrap gap-4">
          <p className="text-xs text-gray-400 font-mono">ID: {notice.id}</p>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors tooltip-trigger" title="Bookmark">
              <Bookmark size={18} />
            </button>
            <button className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors tooltip-trigger" title="Share">
              <Share2 size={18} />
            </button>
            <button 
              onClick={onClose}
              className="ml-2 flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-full shadow-sm hover:bg-primary/90 hover:shadow transition-all"
            >
              <Check size={16} />
              Mark as Read
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default FloatingNotice;
