import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ExternalLink, FileText } from 'lucide-react';

const PdfViewerModal = ({ isOpen, onClose, pdfUrl, fileName = 'Document.pdf', fileSize = 0 }) => {
  if (!isOpen || !pdfUrl) return null;

  const formattedSize = fileSize > 0
    ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB'
    : '';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-900/80 backdrop-blur-md text-white font-sans animate-fade-in text-left">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
            <FileText size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{fileName}</h3>
            {formattedSize && <p className="text-xs text-gray-400 font-medium">{formattedSize}</p>}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Open in New Tab</span>
          </a>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary hover:bg-primaryHover text-white text-xs font-black shadow-sm transition-all"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors ml-2"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* PDF Stage */}
      <div className="flex-1 w-full h-full bg-slate-950 p-2 sm:p-4 overflow-hidden">
        <iframe
          src={pdfUrl}
          title={fileName}
          className="w-full h-full rounded-2xl border border-white/10 bg-white"
        />
      </div>
    </div>,
    document.body
  );
};

export default PdfViewerModal;
