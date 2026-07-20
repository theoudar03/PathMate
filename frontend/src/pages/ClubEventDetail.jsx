import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const ClubEventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { studentData, getMatchedClubs } = useApp();

  const clubs = getMatchedClubs();
  const club = clubs.find(c => c.id === id);

  if (!club) {
    return (
      <div className="text-center py-12 font-sans">
        <span className="material-symbols-outlined text-[48px] text-onSurfaceVariant select-none mx-auto mb-4">help</span>
        <h2 className="text-xl font-bold text-primary">Registry item not found</h2>
        <p className="text-sm text-onSurfaceVariant mt-2">The requested club or event matching registry could not be found.</p>
        <button
          onClick={() => navigate('/clubs')}
          className="mt-6 text-sm text-primary hover:text-[#123669] font-bold flex items-center gap-1.5 mx-auto border border-outline rounded-full px-4 py-2 bg-surface"
        >
          <span className="material-symbols-outlined text-[16px] align-middle select-none">arrow_back</span>
          <span>Return to Matches</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans animate-fade-in text-left">
      {/* Back Link */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-bold text-onSurfaceVariant hover:text-primary transition-all flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary px-1.5 rounded"
        >
          <span className="material-symbols-outlined text-[16px] align-middle select-none">arrow_back</span>
          <span>Back to Matches</span>
        </button>
      </div>

      {/* Main Details Card */}
      <div className="bg-surface border border-surfaceVariant rounded-2xl shadow-elevation1 overflow-hidden">
        {/* Navy Header Stripe */}
        <div className="bg-primary text-onPrimary p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-accent block">
              {club.category} {club.type}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {club.name}
            </h1>
          </div>
          <div className="bg-primaryContainer text-onPrimaryContainer border border-transparent rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary align-middle select-none font-bold">account_balance</span>
            <span>SCE Campus Registry</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-primary">
              About the {club.type}
            </h2>
            <p className="text-sm text-onSurfaceVariant leading-relaxed">
              {club.description}
            </p>
          </div>

          {/* Gemini Reasoning Panel */}
          <div className="bg-surfaceVariant/40 border border-outline/15 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0 mt-0.5 select-none">info</span>
              <div>
                <h3 className="text-xs font-bold text-onSurface">
                  AI match recommendation rationale
                </h3>
                <p className="text-sm text-onSurfaceVariant mt-1.5 leading-relaxed">
                  {club.reason} This recommendation was calculated based on your engineering discipline ({studentData.department}) and selected onboarding interests.
                </p>
              </div>
            </div>
          </div>

          {/* Registration Steps */}
          <div className="bg-primaryContainer/30 border border-primary/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0 mt-0.5 select-none">assignment</span>
              <div>
                <h3 className="text-xs font-bold text-onSurface">
                  Registration Process Steps
                </h3>
                <p className="text-sm text-onSurfaceVariant mt-1.5 leading-relaxed font-mono">
                  {club.registration_steps}
                </p>
              </div>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-surfaceVariant py-6 text-sm text-onSurfaceVariant font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary align-middle select-none flex-shrink-0">location_on</span>
              <div>
                <span className="block text-[10px] font-semibold text-onSurfaceVariant">Meeting location</span>
                <span className="text-onSurface font-semibold">{club.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary align-middle select-none flex-shrink-0">calendar_today</span>
              <div>
                <span className="block text-[10px] font-semibold text-onSurfaceVariant">Weekly timings</span>
                <span className="text-onSurface font-semibold">{club.timings}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary align-middle select-none flex-shrink-0">info</span>
              <div>
                <span className="block text-[10px] font-semibold text-onSurfaceVariant">Requirements</span>
                <span className="text-onSurface font-semibold">{club.requirements}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClubEventDetail;

