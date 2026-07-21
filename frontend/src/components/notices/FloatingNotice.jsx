import React, { useState, useEffect } from 'react';
import './FloatingNotice.css';
import { X, Download, Share2, Bookmark, Check, Calendar, User, FileText, Image as ImageIcon, Eye, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ImageViewerModal from './ImageViewerModal';
import PdfViewerModal from './PdfViewerModal';

const FloatingNotice = ({ notice, onClose }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [activePdf, setActivePdf] = useState(null); // { url, name, size }
  const [imagesLoading, setImagesLoading] = useState(true);

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
  if (notice.priority === 'urgent' || notice.urgent) {
    priorityBg = 'bg-red-100';
    priorityText = 'text-red-700';
  } else if (notice.priority === 'high') {
    priorityBg = 'bg-orange-100';
    priorityText = 'text-orange-700';
  }

  // Parse attachments
  let attachmentList = Array.isArray(notice.attachments) ? notice.attachments : [];
  
  // Fallback for legacy single attachment_url
  if (attachmentList.length === 0 && notice.attachment_url) {
    const isPdf = notice.attachment_url.toLowerCase().endsWith('.pdf');
    attachmentList = [
      {
        id: 'legacy-1',
        original_name: isPdf ? 'Notice_Document.pdf' : 'Notice_Image.png',
        file_type: isPdf ? 'pdf' : 'image',
        mime_type: isPdf ? 'application/pdf' : 'image/png',
        storage_url: notice.attachment_url,
        file_size: 0
      }
    ];
  }

  // Filter attachments by type
  const imageAttachments = attachmentList.filter(a => a.file_type === 'image' || a.mime_type?.startsWith('image/'));
  const pdfAttachments = attachmentList.filter(a => a.file_type === 'pdf' || a.mime_type === 'application/pdf');
  const otherAttachments = attachmentList.filter(a => !imageAttachments.includes(a) && !pdfAttachments.includes(a));

  const currentHeroImage = imageAttachments[selectedImageIndex] || imageAttachments[0];

  const handleDownloadFile = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name || 'Notice_Attachment';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="floating-notice-overlay" onClick={onClose}>
      <div 
        className="floating-notice-paper max-w-4xl w-full" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primaryContainer text-primary flex items-center justify-center font-black tracking-tighter shadow-xs">
              PM
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Saranathan College</p>
              <p className="text-sm font-extrabold text-gray-800">Official Circular</p>
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

        {/* Scrollable Notice Content */}
        <div className="floating-notice-content p-6 sm:p-8 space-y-6">
          {/* Metadata Chips */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${priorityBg} ${priorityText}`}>
              {notice.priority === 'urgent' || notice.urgent ? 'Urgent Notice' : notice.priority === 'high' ? 'High Priority' : 'Official Notice'}
            </span>

            {notice.category && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700">
                {notice.category}
              </span>
            )}

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              {notice.target_audience || notice.target || 'All Students'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight tracking-tight">
            {notice.title}
          </h1>

          {/* Date & Author Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-4 border-b border-dashed border-gray-200">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar size={15} />
              <span>{new Date(notice.publishedAt || notice.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            <div className="flex items-center gap-1.5 font-medium">
              <User size={15} />
              <span>{notice.author || 'SCE Administration'}</span>
            </div>
          </div>

          {/* ── 1. IMAGE HERO GALLERY (If Images Exist) ───────────── */}
          {imageAttachments.length > 0 && currentHeroImage && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-outline/20">
              <div 
                onClick={() => setIsImageViewerOpen(true)}
                className="relative overflow-hidden rounded-2xl border border-outline/20 bg-slate-200 cursor-pointer group shadow-xs max-h-[420px] flex items-center justify-center"
              >
                <img 
                  src={currentHeroImage.storage_url} 
                  alt={currentHeroImage.original_name || 'Notice Attachment'}
                  className="w-full h-auto max-h-[420px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  onLoad={() => setImagesLoading(false)}
                />

                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-2">
                  <Eye size={18} />
                  <span>Click to view in Lightbox</span>
                </div>
              </div>

              {/* Multiple Thumbnails Strip */}
              {imageAttachments.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imageAttachments.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                        idx === selectedImageIndex ? 'border-primary scale-105 shadow-xs' : 'border-outline/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.storage_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 2. NOTICE BODY CONTENT ──────────────────────────────── */}
          <div className="notice-prose text-gray-800 text-sm sm:text-base leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {notice.content}
            </ReactMarkdown>
          </div>

          {/* ── 3. PDF ATTACHMENTS CARDS ───────────────────────────── */}
          {pdfAttachments.length > 0 && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <FileText size={16} className="text-red-500" />
                PDF Documents ({pdfAttachments.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pdfAttachments.map((pdf) => (
                  <div 
                    key={pdf.id || pdf.storage_url}
                    className="p-4 rounded-2xl border border-gray-200 bg-white hover:bg-slate-50 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 font-bold">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-gray-900 truncate">
                          {pdf.original_name || pdf.file_name || 'Notice_Document.pdf'}
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {formatFileSize(pdf.file_size) || 'PDF Document'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setActivePdf({ url: pdf.storage_url, name: pdf.original_name, size: pdf.file_size })}
                        className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-gray-700 transition-colors"
                        title="Preview PDF"
                      >
                        Preview
                      </button>

                      <button
                        onClick={() => handleDownloadFile(pdf.storage_url, pdf.original_name)}
                        className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. OTHER ATTACHMENTS (DOCX / PPT) ───────────────────── */}
          {otherAttachments.length > 0 && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                Additional Attachments ({otherAttachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {otherAttachments.map((att) => (
                  <div key={att.id || att.storage_url} className="p-3 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{att.original_name || att.file_name}</p>
                      <p className="text-[10px] text-gray-500">{formatFileSize(att.file_size)}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(att.storage_url, att.original_name)}
                      className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center flex-wrap gap-4 sticky bottom-0 z-20">
          <p className="text-xs text-gray-400 font-mono">Notice ID: #{notice.id}</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-black rounded-full shadow-sm hover:bg-primaryHover transition-all active:scale-[0.98]"
            >
              <Check size={16} />
              Mark as Read
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Image Viewer Modal */}
      {isImageViewerOpen && (
        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          images={imageAttachments}
          initialIndex={selectedImageIndex}
          noticeTitle={notice.title}
        />
      )}

      {/* PDF Previewer Modal */}
      {activePdf && (
        <PdfViewerModal
          isOpen={!!activePdf}
          onClose={() => setActivePdf(null)}
          pdfUrl={activePdf.url}
          fileName={activePdf.name}
          fileSize={activePdf.size}
        />
      )}
    </div>
  );
};

export default FloatingNotice;
