import React from 'react';

const StepperShell = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  canNext = true,
  children
}) => {
  const percentComplete = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="max-w-2xl mx-auto bg-surface rounded-2xl border border-surfaceVariant p-6 md:p-8 mt-8 shadow-elevation1">
      {/* Header and Progress Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-surfaceVariant pb-6 mb-8 gap-4">
        <div>
          <span className="text-xs text-onSurfaceVariant font-medium font-sans text-left block">
            Profile Setup
          </span>
          <h2 className="text-xl font-bold text-primary mt-1 text-left">
            Step {currentStep} of {totalSteps}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-onSurfaceVariant font-sans">
            {percentComplete}% Complete
          </span>
          <div className="w-24 bg-surfaceVariant h-2 rounded-full overflow-hidden" aria-hidden="true">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Children content area */}
      <div className="min-h-[220px]">
        {children}
      </div>

      {/* Action Footer — Skip removed intentionally. Onboarding is mandatory. */}
      <div className="flex justify-between items-center border-t border-surfaceVariant pt-6 mt-8 font-sans">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 1}
          className="px-4 py-2 text-xs font-bold border border-outline rounded-full hover:bg-surfaceVariant transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-primary flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px] select-none">arrow_back</span>
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="px-5 py-2.5 bg-primary hover:bg-[#123669] text-onPrimary text-xs font-bold rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-1"
        >
          {currentStep === totalSteps ? 'Finish — Build My Portal' : 'Continue'}
          <span className="material-symbols-outlined text-[14px] select-none">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default StepperShell;
