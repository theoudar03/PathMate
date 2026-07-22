import React, { useState } from 'react';
import { Mail } from 'lucide-react';

const RoommateCard = ({ roommate, index }) => {
  const department = roommate.department || roommate.branch || 'Engineering';
  const hostel = roommate.hostel_block || roommate.hostel || 'Hostel';
  const interests = Array.isArray(roommate.interests) ? roommate.interests : (roommate.interests ? (() => { try { return JSON.parse(roommate.interests); } catch { return roommate.interests.split(',').map(s => s.trim()); } })() : []);
  const hobbies = Array.isArray(roommate.hobbies) ? roommate.hobbies : (roommate.hobbies ? (() => { try { return JSON.parse(roommate.hobbies); } catch { return roommate.hobbies.split(',').map(s => s.trim()); } })() : []);
  const allTags = [...new Set([...interests, ...hobbies])].filter(Boolean);
  const email = roommate.contact_email || roommate.email;

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

            {/* Simplified Details Row - sleep schedule only */}
            <div className="my-3 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-outline/15">
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">Sleep Schedule</span>
                <span className="font-semibold text-gray-700">{roommate.sleep_schedule || '10 PM - 6 AM'}</span>
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

      {/* Email Contact Action */}
      <div className="mt-3 text-left">
        {email ? (
          <a
            href={`mailto:${email}?subject=PathMate - Roommate Inquiry`}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-[#123669] text-onPrimary text-xs font-bold py-2.5 px-4 rounded-full transition-all active:scale-[0.98] outline-none shadow-sm"
          >
            <Mail size={15} />
            Email to Connect
          </a>
        ) : (
          <div className="w-full py-2.5 px-4 rounded-full bg-surfaceContainerLow text-onSurfaceVariant text-xs font-bold text-center flex items-center justify-center gap-1.5 border border-surfaceVariant">
            <span className="material-symbols-outlined text-[15px]">mail_lock</span>
            Contact via Admin
          </div>
        )}
      </div>
    </div>
  );
};

export default RoommateCard;
