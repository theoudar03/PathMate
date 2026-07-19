import React from 'react';
import { BookOpen } from 'lucide-react';

const SourceTag = ({ sourceName }) => {
  return (
    <div className="inline-flex items-center gap-1 bg-[#F0F4FF] border border-[#D9E2EC] text-primary px-2.5 py-1 rounded-md text-xs font-sans font-medium mt-2 mr-2">
      <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      <span className="text-[11px]">
        Source: <strong className="font-semibold">{sourceName}</strong>
      </span>
    </div>
  );
};

export default SourceTag;
