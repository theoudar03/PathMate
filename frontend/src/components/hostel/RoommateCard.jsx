import React, { useState } from 'react';

const RoommateCard = ({ roommate, index }) => {
  const [requested, setRequested] = useState(false);
  const department = roommate.department || roommate.branch || 'Engineering';
  const hostel = roommate.hostel_block || roommate.hostel || 'Hostel Block';
  const interests = Array.isArray(roommate.interests) ? roommate.interests : (roommate.interests ? JSON.parse(roommate.interests) : []);
  const hobbies = Array.isArray(roommate.hobbies) ? roommate.hobbies : (roommate.hobbies ? JSON.parse(roommate.hobbies) : []);
  const allTags = [...interests, ...hobbies];

  const handleRequestMatch = () => {
    setRequested(true);
  };

  return (
    <div
      className={`bg-surfaceContainerLowest border border-surfaceVariant rounded-2xl p-5 shadow-elevation1 hover:shadow-elevation2 hover:border-primary/30 transition-all duration-200 ease-out flex flex-col justify-between stagger-item stagger-delay-${(index % 8) + 1}`}
    >
      <div>
        {/* Card Header Profile Summary */}
        <div className="flex justify-between items-start mb-3 gap-2 text-left">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                {hostel}
              </span>
              <span className="text-[10px] font-sans font-semibold text-onSurfaceVariant flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px] text-primary align-middle select-none">school</span>
                {department}
              </span>
            </div>

            <h3 className="text-base font-bold text-onSurface mb-1">
              {roommate.name}
            </h3>

            <div className="grid grid-cols-2 gap-2 my-3 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-outline/15">
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">Sleep Schedule</span>
                <span className="font-semibold text-gray-700">{roommate.sleep_schedule || '10 PM - 6 AM'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">Cleanliness</span>
                <span className="font-semibold text-gray-700">{roommate.cleanliness || 'Neat'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">Food Preference</span>
                <span className="font-semibold text-gray-700">{roommate.food_preference || 'Vegetarian'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">Study Habits</span>
                <span className="font-semibold text-gray-700">{roommate.study_habits || 'Quiet'}</span>
              </div>
            </div>
            
            {allTags.length > 0 && (
              <>
                <strong className="text-onSurfaceVariant text-[11px] font-medium block mt-2 mb-1">Interests & Hobbies:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-secondaryContainer text-onSecondaryContainer rounded-full text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Notice & Request Trigger */}
      <div className="space-y-3 mt-3 text-left">
        <div className="flex gap-1.5 items-start bg-surfaceContainerLow rounded-xl p-3 border border-surfaceVariant/60 text-[10px] text-onSurfaceVariant leading-normal">
          <span className="material-symbols-outlined text-primary text-[16px] flex-shrink-0 select-none">shield</span>
          <p>
            <strong className="font-bold text-onSurface">Safe Privacy Rule:</strong> Contact details are locked until mutual connection request is accepted.
          </p>
        </div>

        {requested ? (
          <div className="w-full py-2.5 px-4 rounded-full bg-green-100 text-green-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Connection Request Sent
          </div>
        ) : (
          <button
            onClick={handleRequestMatch}
            className="w-full bg-primary hover:bg-[#123669] text-onPrimary text-xs font-bold py-2.5 px-4 rounded-full transition-all active:scale-[0.98] outline-none shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Request Roommate Connection
          </button>
        )}
      </div>
    </div>
  );
};

export default RoommateCard;
