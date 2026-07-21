import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastSnackbar = ({ message, type = 'success', isOpen, onClose, duration = 3500 }) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen || !message) return null;

  let bg = 'bg-emerald-900/90 text-white border-emerald-500/40';
  let icon = <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />;

  if (type === 'error') {
    bg = 'bg-rose-900/90 text-white border-rose-500/40';
    icon = <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />;
  } else if (type === 'warning') {
    bg = 'bg-amber-900/90 text-white border-amber-500/40';
    icon = <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />;
  } else if (type === 'info') {
    bg = 'bg-blue-900/90 text-white border-blue-500/40';
    icon = <Info size={18} className="text-blue-400 flex-shrink-0" />;
  }

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[10000] animate-slide-up select-none font-sans text-left">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl ${bg}`}>
        {icon}
        <span className="text-xs font-extrabold tracking-wide max-w-sm sm:max-w-md truncate">
          {message}
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors ml-2"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

export default ToastSnackbar;
