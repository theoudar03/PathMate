import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/chatbot/ChatWindow';
import { safeFetchJson } from '../utils/api';
import { useApp } from '../contexts/AppContext';

const Chatbot = () => {
  const { t } = useApp();
  const [suggestedFaqs, setSuggestedFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuggested = async () => {
      try {
        const res = await safeFetchJson('/api/suggested-faqs');
        if (res.ok && Array.isArray(res.data)) {
          setSuggestedFaqs(res.data);
        }
      } catch (err) {
        console.error("Failed to load suggested FAQs:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSuggested();
  }, []);

  const handleFaqClick = (text) => {
    const event = new CustomEvent('pm-insert-query', { detail: text });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in text-left py-4 max-w-5xl mx-auto">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="border-b border-surfaceVariant pb-3.5">
        <span className="text-xs text-onSurfaceVariant font-medium">{t('chatbotPageDesk')}</span>
        <h1 className="text-3xl font-extrabold text-primary mt-1 flex items-center">
          <span className="material-symbols-outlined text-primary text-[32px] select-none align-middle mr-2">chat</span>
          {t('chatbotPageTitle')}
        </h1>
        <p className="text-sm text-onSurfaceVariant mt-2 leading-relaxed">
          {t('chatbotPageDesc')}
        </p>
      </div>

      {/* ── Full-width Chat Window ───────────────────────────────── */}
      <ChatWindow />

      {/* ── Grounded AI Info Bar ────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-surfaceVariant/40 border border-outline/15 rounded-xl px-4 py-3">
        <span className="material-symbols-outlined text-primary text-[20px] select-none mt-0.5 flex-shrink-0">info</span>
        <p className="text-xs text-onSurfaceVariant leading-relaxed">
          <span className="font-bold text-onSurface">{t('groundedAiStandard')}</span>{' '}
          {t('groundedAiDesc')}
        </p>
      </div>

      {/* ── Suggested FAQ Cards (horizontal strip) ──────────────── */}
      {!loading && suggestedFaqs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-onSurface mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px] select-none align-middle">help</span>
            {t('suggestedQuestions')}
          </h3>

          {/* Scrollable horizontal row */}
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-surfaceVariant) transparent' }}
          >
            {suggestedFaqs.map((faq, idx) => (
              <button
                key={faq.id || idx}
                type="button"
                onClick={() => handleFaqClick(faq.question)}
                className="flex-shrink-0 w-52 text-left p-4 rounded-2xl border border-surfaceVariant bg-surface hover:bg-secondaryContainer hover:border-primary/30 hover:shadow-elevation1 text-onSurface transition-all duration-150 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="material-symbols-outlined text-[16px] select-none text-primary group-hover:text-primary transition-colors"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {faq.icon || 'help'}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-onSurfaceVariant group-hover:text-primary transition-colors">
                    {faq.category || 'FAQ'}
                  </span>
                </div>
                <p className="text-xs font-semibold leading-snug text-onSurface line-clamp-3">
                  "{faq.question}"
                </p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[12px] select-none">send</span>
                  {t('askThis')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Chatbot;
