import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import MatchCard from '../components/matches/MatchCard';
import EmptyState from '../components/common/EmptyState';
import ToastSnackbar from '../components/common/ToastSnackbar';
import { Sparkles, RefreshCw, Search } from 'lucide-react';

const ClubsEvents = () => {
  const { fetchedClubsEvents, refetchClubsEvents } = useApp();
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await refetchClubsEvents();
    } catch (err) {
      setErrorMsg('Unable to load campus events and clubs right now. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const allMatches = fetchedClubsEvents || [];

  const filteredMatches = allMatches.filter(item => {
    const matchesType = filterType === 'All' || item.type === filterType;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (item.name || item.title || '').toLowerCase().includes(searchLower) ||
      (item.description || item.short_description || '').toLowerCase().includes(searchLower) ||
      (item.category || '').toLowerCase().includes(searchLower) ||
      (item.organizer || item.department || '').toLowerCase().includes(searchLower)
    );
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-8 font-sans animate-fade-in py-6 max-w-5xl mx-auto text-left select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-outline/30">
        <div>
          <span className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">
            Saranathan Student Communities
          </span>
          <h1 className="text-3xl font-black text-onSurface mt-1 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
            Campus Clubs & Events
          </h1>
          <p className="text-sm text-onSurfaceVariant mt-2 leading-relaxed">
            Discover official student clubs, workshops, guest lectures, and campus committees managed by Saranathan College of Engineering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surfaceContainer border border-outline/30 text-xs font-bold text-onSurface hover:bg-surfaceContainerHigh transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primaryContainer border border-primary/20 text-[12px] font-bold text-onPrimaryContainer select-none flex-shrink-0">
            <span className="material-symbols-outlined text-[15px] align-middle select-none text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span>Official Campus Portal</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Category Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Segmented Buttons */}
        <div className="inline-flex border border-outline/40 rounded-full p-1 bg-white dark:bg-surfaceContainer shadow-xs self-start" role="group">
          {['All', 'Club', 'Event', 'Committee'].map(type => {
            const isSelected = filterType === type;
            const displayLabel = type === 'All' ? 'All Items' : type === 'Club' ? 'Clubs' : type === 'Event' ? 'Events' : 'Committees';
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all duration-150 ${
                  isSelected
                    ? 'bg-primary text-onPrimary shadow-xs'
                    : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-onSurfaceVariant">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, category, department..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-surface border border-outline/30 rounded-full text-onSurface placeholder:text-onSurfaceVariant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-onSurfaceVariant hover:text-onSurface"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Honest Error State Banner */}
      {errorMsg && (
        <div className="bg-errorContainer text-onErrorContainer p-4 rounded-2xl border border-error/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-xl">error</span>
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-1.5 bg-error text-onError font-bold text-xs rounded-full hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Skeleton Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surfaceContainerLow border border-surfaceVariant rounded-2xl p-5 h-64 animate-pulse">
              <div className="h-32 bg-surfaceContainerHigh rounded-xl mb-4" />
              <div className="h-4 bg-surfaceContainerHigh rounded w-3/4 mb-2" />
              <div className="h-3 bg-surfaceContainerHigh rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Matches Grid or Empty State */}
      {!isLoading && !errorMsg && (
        filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((item, idx) => (
              <MatchCard key={item.id} club={item} index={idx} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title={searchTerm ? `No matches found for "${searchTerm}"` : `No ${filterType === 'All' ? 'published campus' : filterType} items right now`}
            description={searchTerm ? "Try searching with a different keyword or department name." : "Official events and clubs published by college management will appear here dynamically."}
            actionLabel={searchTerm ? "Clear Search" : "Reset Filter"}
            onAction={() => { setSearchTerm(''); setFilterType('All'); }}
          />
        )
      )}

      <ToastSnackbar
        isOpen={showToast}
        message={toastMessage}
        type="success"
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default ClubsEvents;
