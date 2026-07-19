import React, { useState } from 'react';

const ChipSelect = ({
  options,
  selected = [],
  onChange,
  multiple = false,
  label = '',
  otherText = '',
  onOtherTextChange,
  placeholder = 'Please specify...'
}) => {
  const [showOtherInput, setShowOtherInput] = useState(
    multiple 
      ? selected.includes('Other') 
      : selected === 'Other'
  );

  const handleChipClick = (option) => {
    if (multiple) {
      let nextSelected;
      if (selected.includes(option)) {
        nextSelected = selected.filter(item => item !== option);
      } else {
        nextSelected = [...selected, option];
      }
      
      if (option === 'Other') {
        setShowOtherInput(!selected.includes('Other'));
      }
      
      onChange(nextSelected);
    } else {
      const isOther = option === 'Other';
      setShowOtherInput(isOther);
      onChange(option);
    }
  };

  const isSelected = (option) => {
    if (multiple) {
      return selected.includes(option);
    }
    return selected === option;
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {label && (
        <span className="text-sm font-bold text-onSurface block mb-1">
          {label}
        </span>
      )}

      {/* Chip Grid */}
      <div className="flex flex-wrap gap-2.5" role="group" aria-label={label}>
        {options.map((option) => {
          const active = isSelected(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleChipClick(option)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border transition-all duration-200 ease-in-out cursor-pointer text-xs font-bold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none select-none active:scale-[0.97] ${
                active
                  ? 'bg-primary border-primary text-white shadow-elevation2'
                  : 'bg-surface border-primary text-primary hover:bg-primaryContainer/20 hover:text-[#123669]'
              }`}
            >
              {active && <span className="material-symbols-outlined text-[13px] font-black select-none">check</span>}
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Conditional Text Input for "Other" option */}
      {showOtherInput && (
        <div className="mt-2.5 animate-fade-in stagger-delay-1 text-left">
          <label 
            htmlFor="custom-chip-specify" 
            className="block text-xs font-semibold text-onSurfaceVariant mb-1.5"
          >
            Please specify details:
          </label>
          <input
            id="custom-chip-specify"
            type="text"
            value={otherText}
            onChange={(e) => onOtherTextChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 border border-outline rounded-lg font-sans text-sm text-onSurface focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface"
          />
        </div>
      )}
    </div>
  );
};

export default ChipSelect;
