import React, { useState, useEffect } from 'react';
import { Bus, Sun, Moon, Clock, Eye, AlertTriangle, History, CheckCircle2, ChevronRight } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';
import BusRouteViewerModal from './BusRouteViewerModal';

const BusRouteWidget = () => {
  const [routes, setRoutes] = useState({ morning: null, evening: null });
  const [activeSession, setActiveSession] = useState('morning');
  const [loading, setLoading] = useState(true);

  // Archive modal / drawer
  const [archiveRoutes, setArchiveRoutes] = useState([]);
  const [showArchive, setShowArchive] = useState(false);

  // Viewer Modal
  const [selectedRouteForViewer, setSelectedRouteForViewer] = useState(null);

  // Auto-determine Morning vs Evening session based on current time
  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 12) {
      setActiveSession('evening');
    } else {
      setActiveSession('morning');
    }
  }, []);

  const fetchTodayRoutes = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson('/api/bus-routes/today');
      if (res.ok && res.data) {
        setRoutes({
          morning: res.data.morning || null,
          evening: res.data.evening || null
        });
      }
    } catch (err) {
      console.error("Error fetching today's bus routes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchive = async () => {
    try {
      const res = await safeFetchJson('/api/bus-routes/archive');
      if (res.ok && Array.isArray(res.data)) {
        setArchiveRoutes(res.data);
      }
    } catch (err) {
      console.error("Error fetching bus route archive:", err);
    }
  };

  useEffect(() => {
    fetchTodayRoutes();
  }, []);

  const activeRoute = activeSession === 'morning' ? routes.morning : routes.evening;

  return (
    <div className="bg-surfaceContainerLowest border border-surfaceVariant rounded-[28px] p-5 shadow-elevation1 space-y-4 text-left font-sans transition-all hover:border-primary/30">
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 border-b border-surfaceVariant pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Bus size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-onSurface">Today's Bus Routes</h3>
            <p className="text-[11px] text-onSurfaceVariant">Official College Transport Notice Board</p>
          </div>
        </div>

        <button
          onClick={() => { setShowArchive(true); fetchArchive(); }}
          className="text-primary hover:text-primaryHover text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="View Historical Route Board Archive"
        >
          <History size={14} />
          <span className="hidden sm:inline">Archive</span>
        </button>
      </div>

      {/* Session Switcher (Morning / Evening) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-surfaceContainerLow rounded-2xl border border-surfaceVariant/60 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSession('morning')}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSession === 'morning'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-onSurfaceVariant hover:text-onSurface'
          }`}
        >
          <Sun size={14} />
          <span>Morning Route</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSession('evening')}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSession === 'evening'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-onSurfaceVariant hover:text-onSurface'
          }`}
        >
          <Moon size={14} />
          <span>Evening Route</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-8 text-center text-xs text-onSurfaceVariant font-semibold">Loading official bus route notice...</div>
      ) : activeRoute ? (
        <div className="space-y-3 animate-fade-in">
          {/* Status & Last Updated Banner */}
          <div className="bg-surfaceContainerLow p-3 rounded-2xl border border-surfaceVariant/80 space-y-1 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 size={12} /> Published & Verified
              </span>
              <span className="text-onSurfaceVariant font-mono text-[10px] flex items-center gap-1">
                <Clock size={11} /> {new Date(activeRoute.updated_at || activeRoute.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="font-bold text-onSurface text-sm truncate">{activeRoute.title}</p>
            {activeRoute.description && (
              <p className="text-[11px] text-onSurfaceVariant line-clamp-2">{activeRoute.description}</p>
            )}
          </div>

          {/* Quick View Button */}
          <button
            onClick={() => setSelectedRouteForViewer(activeRoute)}
            className="w-full bg-primary hover:bg-primaryHover text-white py-3 px-4 rounded-2xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Eye size={16} />
            <span>View Today's Route Board Image</span>
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div className="bg-surfaceContainerLow border border-surfaceVariant/80 rounded-2xl p-6 text-center space-y-2">
          <Bus size={32} className="mx-auto text-onSurfaceVariant/60" />
          <h4 className="text-sm font-bold text-onSurface">No {activeSession === 'morning' ? 'Morning' : 'Evening'} Route Published Yet</h4>
          <p className="text-[11px] text-onSurfaceVariant leading-relaxed">
            The transport administration has not published a route board image for this session today. Check back shortly.
          </p>
        </div>
      )}

      {/* Warning Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5 flex items-center gap-2 text-[10px] text-amber-800">
        <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
        <span>Bus routes may change daily. Please refer to the latest published route board image.</span>
      </div>

      {/* Interactive High-Res Image Viewer Modal */}
      {selectedRouteForViewer && (
        <BusRouteViewerModal
          route={selectedRouteForViewer}
          onClose={() => setSelectedRouteForViewer(null)}
        />
      )}

      {/* Archive Drawer Modal */}
      {showArchive && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-surfaceVariant rounded-3xl p-6 w-full max-w-lg shadow-elevation3 space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center border-b border-surfaceVariant pb-3">
              <h3 className="text-base font-bold text-onSurface flex items-center gap-2">
                <History className="text-primary" size={18} />
                Bus Route History & Archive
              </h3>
              <button onClick={() => setShowArchive(false)} className="text-onSurfaceVariant hover:text-onSurface cursor-pointer">
                <Clock size={18} />
              </button>
            </div>

            {archiveRoutes.length > 0 ? (
              <div className="space-y-3">
                {archiveRoutes.map(ar => (
                  <div key={ar.id} className="p-3 bg-surfaceContainerLow rounded-2xl border border-surfaceVariant flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                          Archived ({ar.session})
                        </span>
                        <span className="text-[10px] text-onSurfaceVariant font-mono">
                          {ar.route_date ? new Date(ar.route_date).toLocaleDateString() : 'Previous'}
                        </span>
                      </div>
                      <p className="font-bold text-onSurface mt-1">{ar.title}</p>
                    </div>

                    <button
                      onClick={() => { setSelectedRouteForViewer(ar); setShowArchive(false); }}
                      className="bg-primary/10 hover:bg-primary/20 text-primary font-bold px-3 py-1.5 rounded-full text-[11px] cursor-pointer"
                    >
                      View Image
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-onSurfaceVariant text-center py-6">No archived bus route records found.</p>
            )}

            <div className="flex justify-end pt-2 border-t border-surfaceVariant">
              <button
                onClick={() => setShowArchive(false)}
                className="px-4 py-1.5 bg-surfaceContainerHigh text-onSurface rounded-full font-bold text-xs hover:bg-surfaceVariant transition-colors cursor-pointer"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusRouteWidget;
