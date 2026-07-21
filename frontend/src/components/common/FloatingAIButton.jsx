import React from 'react';
import { useNavigate } from 'react-router-dom';

const FloatingAIButton = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-36 right-4 sm:right-6 z-40 flex flex-col items-center gap-1 animate-fade-in">
      <span className="text-[9px] font-black text-primary bg-white px-2 py-0.5 rounded-md shadow-xs border border-primary/20 tracking-wider uppercase">
        AI Assistant
      </span>
      <button
        type="button"
        onClick={() => navigate('/chatbot')}
        className="relative w-12 h-12 sm:w-14 sm:h-14 bg-primary text-white rounded-2xl shadow-elevation3 hover:bg-primaryHover transition-all flex items-center justify-center border-none hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary group"
        aria-label="Open AI Assistant"
        title="Ask PathMate AI Assistant"
      >
        <span className="material-symbols-outlined text-[22px] sm:text-[26px] select-none align-middle group-hover:rotate-12 transition-transform">
          chat
        </span>

        {/* AI Notification Badge */}
        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full absolute -top-1.5 -right-1.5 border-2 border-white shadow-xs leading-none">
          AI
        </span>
      </button>
    </div>
  );
};

export default FloatingAIButton;
