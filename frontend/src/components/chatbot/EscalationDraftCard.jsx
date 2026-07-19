import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

const EscalationDraftCard = ({ unresolvedQuery, escalationDraft }) => {
  const { studentData, t } = useApp();
  const [copied, setCopied] = useState(false);

  const studentName = studentData.name || 'First-Year Student';
  const departmentName = studentData.department || '[Your Department]';
  
  const escalationContact = {
    name: 'Prof. SCE Student Affairs Office',
    email: 'studentwelfare@saranathan.ac.in',
  };

  // Use pre-translated backend draft or compile default English draft
  const draftMessage = escalationDraft || `Respected Sir/Madam,\n\nI am a new first-year student of Saranathan College of Engineering in the ${departmentName} department.\n\nI have a query regarding: "${unresolvedQuery}"\n\nCould you please assist me with this or guide me to the correct administrative coordinator?\n\nThank you,\n${studentName}\n(SCE Batch of 2026)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(draftMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surfaceVariant/30 border border-outline/15 rounded-xl p-5 my-4 font-sans stagger-item text-left">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <span className="material-symbols-outlined text-primary text-[24px] select-none align-middle">person_check</span>
        </div>
        <div>
          <h4 className="text-sm font-bold text-primary">
            {t('escalateHeader')}
          </h4>
          <p className="text-xs text-onSurfaceVariant leading-relaxed mt-0.5">
            {t('escalateDesc')}
          </p>
        </div>
      </div>

      {/* Draft text display block */}
      <div className="bg-surface border border-outline rounded-lg p-3 text-xs text-onSurfaceVariant font-mono whitespace-pre-wrap leading-relaxed relative my-4 pr-16">
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-lg border border-outline bg-surface hover:bg-surfaceVariant text-onSurfaceVariant hover:text-onSurface transition-all flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          title={t('copy')}
          aria-label={t('copy')}
        >
          {copied ? (
            <>
              <span className="material-symbols-outlined text-[14px] text-[#2E7D32] align-middle select-none">check</span>
              <span className="text-[10px] font-sans font-semibold">{t('copied')}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[14px] align-middle select-none">content_copy</span>
              <span className="text-[10px] font-sans font-semibold">{t('copy')}</span>
            </>
          )}
        </button>
        {draftMessage}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <a
          href={`mailto:${escalationContact.email}?subject=${encodeURIComponent('PathMate Unresolved Freshman Query')}&body=${encodeURIComponent(draftMessage)}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primaryHover text-white text-xs font-bold py-2.5 px-4 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shadow-sm text-center"
          style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
        >
          <span className="material-symbols-outlined text-[16px] align-middle select-none">mail</span>
          <span>{t('openEmailBtn')}</span>
        </a>
      </div>
    </div>
  );
};

export default EscalationDraftCard;

