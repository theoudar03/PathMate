import React, { createContext, useContext, useState, useEffect } from 'react';
import { LOCALIZATION_DICTS } from '../utils/localization';

const AppContext = createContext();



export const AppProvider = ({ children }) => {
  // Authentication State
  const [token, setToken] = useState(() => {
    return localStorage.getItem('pm_auth_token') || null;
  });

  const [user, setUser] = useState(null);
  const [onboarded, setOnboarded] = useState(false);

  const [studentData, setStudentData] = useState(() => {
    const savedUser = localStorage.getItem('pm_user');
    const u = savedUser ? JSON.parse(savedUser) : null;
    return {
      name: u?.full_name || u?.name || '',
      department: u?.department || '',
      isHosteller: u?.hosteller || false,
      interests: u?.interests || [],
      otherInterest: u?.otherInterest || '',
      backgroundText: u?.custom_notes || '',
      onboardingCompletedAt: u?.created_at || '',
      gender: u?.gender || 'Male',
      travel_mode: u?.travel_mode || 'own_transport'
    };
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('pm_lang') || 'en';
  });

  const [completedChecklist, setCompletedChecklist] = useState(() => {
    const data = localStorage.getItem('pm_checklist');
    return data ? JSON.parse(data) : [];
  });

  const [customChecklist, setCustomChecklist] = useState(() => {
    const data = localStorage.getItem('pm_custom_checklist');
    return data ? JSON.parse(data) : [];
  });

  const [connectedRoommates, setConnectedRoommates] = useState(() => {
    const data = localStorage.getItem('pm_connected_roommates');
    return data ? JSON.parse(data) : [];
  });

  const [roommateRequests, setRoommateRequests] = useState(() => {
    const data = localStorage.getItem('pm_roommate_requests');
    return data ? JSON.parse(data) : [];
  });

  const [optedInClubs, setOptedInClubs] = useState(() => {
    const data = localStorage.getItem('pm_opted_in_clubs');
    return data ? JSON.parse(data) : [];
  });

  // ── DB-backed state: notice reads, bookmarks, fresher checklist ────────────
  const [dbReadNotices, setDbReadNotices] = useState(() => {
    const data = localStorage.getItem('pm_read_notices');
    return data ? JSON.parse(data) : [];
  });

  const [dbBookmarkedNotices, setDbBookmarkedNotices] = useState(() => {
    const data = localStorage.getItem('pm_bookmarked_notices');
    return data ? JSON.parse(data) : [];
  });

  const [dbFresherChecklist, setDbFresherChecklist] = useState(() => {
    const data = localStorage.getItem('pm_fresher_checklist');
    return data ? JSON.parse(data) : {};
  });

  const [notifications, setNotifications] = useState([]);

  const [initializing, setInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [fetchedClubsEvents, setFetchedClubsEvents] = useState([]);

  // Fetch real clubs and events from PostgreSQL database
  const refetchClubsEvents = async () => {
    try {
      const [clubsRes, eventsRes, commRes] = await Promise.all([
        fetch('/api/clubs'),
        fetch('/api/events'),
        fetch('/api/committees')
      ]);
      const clubs = clubsRes.ok ? await clubsRes.json() : [];
      const events = eventsRes.ok ? await eventsRes.json() : [];
      const committees = commRes.ok ? await commRes.json() : [];

      const formattedClubs = (Array.isArray(clubs) ? clubs : []).map(c => ({
        id: `club-${c.id}`,
        dbId: c.id,
        name: c.name,
        title: c.name,
        short_description: c.short_description || '',
        description: c.description || c.short_description || c.name,
        reason: 'Official SCE Club',
        category: c.category || 'Club',
        type: 'Club',
        department: c.department || 'All Departments',
        location: c.meeting_location || c.location || 'SCE Campus',
        meeting_location: c.meeting_location || c.location || 'SCE Campus',
        meeting_schedule: c.meeting_schedule || 'TBD',
        faculty_coordinator: c.faculty_coordinator || '',
        student_coordinator: c.student_coordinator || '',
        contact_email: c.contact_email || '',
        contact_phone: c.contact_phone || '',
        membership_url: c.membership_url || '',
        image_url: c.image_url || '',
        logo_url: c.logo_url || '',
        requirements: c.eligibility || 'Open to all students',
        timings: c.meeting_schedule || 'TBD',
        registration_steps: c.registration_steps || 'Please contact the coordinator.'
      }));

      const formattedEvents = (Array.isArray(events) ? events : []).map(e => ({
        id: `event-${e.id}`,
        dbId: e.id,
        name: e.title || e.name,
        title: e.title || e.name,
        short_description: e.short_description || '',
        description: e.description || e.short_description || e.name,
        reason: 'Upcoming Campus Event',
        category: e.category || 'Event',
        event_type: e.event_type || 'General',
        type: 'Event',
        organizer: e.organizer || 'Saranathan College of Engineering',
        venue: e.venue || e.location || 'SCE Campus',
        location: e.venue || e.location || 'SCE Campus',
        event_date: e.event_date || e.date,
        start_time: e.start_time || '',
        end_time: e.end_time || '',
        registration_deadline: e.registration_deadline || null,
        registration_url: e.registration_url || '',
        capacity: e.capacity || 100,
        registration_count: e.registration_count || 0,
        image_url: e.image_url || e.poster || '',
        poster: e.image_url || e.poster || '',
        requirements: 'Open to all students',
        timings: (e.event_date || e.date) ? new Date(e.event_date || e.date).toLocaleString() : 'TBD',
        registration_steps: e.registration_steps || 'Registration details pending.'
      }));

      const formattedCommittees = (Array.isArray(committees) ? committees : []).map(c => ({
        id: `comm-${c.id}`,
        dbId: c.id,
        name: c.name,
        title: c.name,
        description: c.description || '',
        reason: 'Official College Committee',
        category: 'Committee',
        type: 'Committee',
        location: c.location || 'SCE Campus',
        requirements: 'Open to interested students',
        timings: 'TBD'
      }));

      setFetchedClubsEvents([...formattedClubs, ...formattedEvents, ...formattedCommittees]);
    } catch (err) {
      console.error('Failed to fetch database clubs/events/committees:', err);
    }
  };

  useEffect(() => {
    refetchClubsEvents();
  }, []);

  // Verify auth token and preload icon fonts once on initial startup load
  useEffect(() => {
    const startInitialization = async () => {
      // 1. Start preloading the Material Symbols font
      const fontPromise = document.fonts
        ? document.fonts.load('1em "Material Symbols Outlined"')
            .then(() => {
              if (document.fonts.check('1em "Material Symbols Outlined"')) {
                document.documentElement.classList.add('pm-icons-loaded');
              }
            })
            .catch(err => console.warn('Failed to load Material Symbols font face:', err))
        : Promise.resolve();

      // Create a safety timeout of 2.5 seconds for font loading so offline/firewalls don't block app launch
      const fontTimeout = new Promise((resolve) => setTimeout(resolve, 2500));

      // 2. Start verifying auth token
      const authPromise = token
        ? fetch('/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(res => {
            // Only treat 401/403 as actual auth failures — not network errors
            if (res.status === 401 || res.status === 403) {
              throw Object.assign(new Error('Token validation failed'), { isAuthError: true });
            }
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            return res.json();
          })
          .then(async (data) => {
            if (data.success && data.user) {
              setUser(data.user);
              localStorage.setItem('pm_user', JSON.stringify(data.user));
              setOnboarded(true);
              if (data.user.preferred_language) {
                setLanguage(data.user.preferred_language);
                localStorage.setItem('pm_lang', data.user.preferred_language);
              }
              // Fetch DB-backed user state (reads, bookmarks, checklist)
              try {
                await Promise.all([
                  fetch('/api/state/user-state', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                  .then(r => r.ok ? r.json() : null)
                  .then(stateData => {
                    if (stateData && stateData.success) {
                      setDbReadNotices(stateData.readNotices || []);
                      localStorage.setItem('pm_read_notices', JSON.stringify(stateData.readNotices || []));
                      setDbBookmarkedNotices(stateData.bookmarkedNotices || []);
                      localStorage.setItem('pm_bookmarked_notices', JSON.stringify(stateData.bookmarkedNotices || []));
                      if (stateData.fresherChecklist) {
                        setDbFresherChecklist(stateData.fresherChecklist);
                        localStorage.setItem('pm_fresher_checklist', JSON.stringify(stateData.fresherChecklist));
                      }
                    }
                  }),
                  fetch('/api/state/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                  .then(r => r.ok ? r.json() : null)
                  .then(notifData => {
                    if (notifData && notifData.success) {
                      setNotifications(notifData.notifications || []);
                    }
                  })
                ]);
              } catch (err) {
                console.warn('Failed to load DB state in parallel:', err.message);
              }
            } else {
              throw new Error('Invalid user payload');
            }
          })
          .catch(err => {
            if (err.isAuthError) {
              // Only clear session on genuine 401/403 (expired or revoked token)
              console.warn("Session expired or invalid token. Clearing session:", err.message);
              resetAllData();
            } else {
              // Network error / server down — keep the cached session alive
              console.warn("Auth check failed (network/server issue). Keeping existing session:", err.message);
              const cachedUser = localStorage.getItem('pm_user');
              if (cachedUser) {
                try {
                  setUser(JSON.parse(cachedUser));
                  setOnboarded(true);
                } catch (_) {}
              }
            }
          })
        : Promise.resolve().then(() => {
            resetAllData();
          });

      // 3. Wait for both auth check and font loading to complete (with safety race limit)
      try {
        await Promise.all([
          authPromise,
          Promise.race([fontPromise, fontTimeout])
        ]);
      } catch (err) {
        console.error('Initialization error during startup:', err);
      } finally {
        if (document.fonts && document.fonts.check('1em "Material Symbols Outlined"')) {
          document.documentElement.classList.add('pm-icons-loaded');
        }
        setInitializing(false);
      }
    };

    startInitialization();
  }, [token]);

  // Handle branded splash loader timing to avoid flashing on super-fast network queries
  useEffect(() => {
    let timer;
    if (initializing) {
      timer = setTimeout(() => {
        setShowSplash(true);
      }, 300);
    } else {
      setShowSplash(false);
    }
    return () => clearTimeout(timer);
  }, [initializing]);

  // Sync studentData when user changes
  useEffect(() => {
    if (user) {
      setStudentData({
        name: user.full_name || user.name || '',
        department: user.department || '',
        isHosteller: user.hosteller || false,
        interests: user.interests || [],
        otherInterest: user.otherInterest || '',
        backgroundText: user.custom_notes || '',
        onboardingCompletedAt: user.created_at || '',
        gender: user.gender || 'Male',
        travel_mode: user.travel_mode || 'own_transport'
      });
    }
  }, [user]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('pm_onboarded', onboarded.toString());
  }, [onboarded]);

  useEffect(() => {
    localStorage.setItem('pm_student_data', JSON.stringify(studentData));
  }, [studentData]);

  useEffect(() => {
    localStorage.setItem('pm_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('pm_checklist', JSON.stringify(completedChecklist));
  }, [completedChecklist]);

  useEffect(() => {
    localStorage.setItem('pm_custom_checklist', JSON.stringify(customChecklist));
  }, [customChecklist]);

  useEffect(() => {
    localStorage.setItem('pm_connected_roommates', JSON.stringify(connectedRoommates));
  }, [connectedRoommates]);

  useEffect(() => {
    localStorage.setItem('pm_roommate_requests', JSON.stringify(roommateRequests));
  }, [roommateRequests]);

  useEffect(() => {
    localStorage.setItem('pm_opted_in_clubs', JSON.stringify(optedInClubs));
  }, [optedInClubs]);

  // Methods
  const completeOnboarding = (userData, authToken) => {
    setToken(authToken);
    setUser(userData);
    setOnboarded(true);
    if (userData.preferred_language) {
      setLanguage(userData.preferred_language);
      localStorage.setItem('pm_lang', userData.preferred_language);
    }
    localStorage.setItem('pm_auth_token', authToken);
    localStorage.setItem('pm_user', JSON.stringify(userData));
    localStorage.setItem('pm_onboarded', 'true');
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    localStorage.setItem('pm_lang', lang);
    if (token) {
      try {
        await fetch('/auth/change-language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ language: lang })
        });
      } catch (err) {
        console.error("Failed to sync language preference to DB:", err.message);
      }
    }
  };

  const t = (key) => {
    const dict = LOCALIZATION_DICTS[language] || LOCALIZATION_DICTS['en'];
    return dict[key] || LOCALIZATION_DICTS['en'][key] || key;
  };

  const resetAllData = () => {
    setToken(null);
    setUser(null);
    setOnboarded(false);
    setLanguage('en');
    setStudentData({
      name: '',
      department: '',
      isHosteller: false,
      interests: [],
      otherInterest: '',
      backgroundText: '',
      onboardingCompletedAt: ''
    });
    setCompletedChecklist([]);
    setCustomChecklist([]);
    setConnectedRoommates([]);
    setRoommateRequests([]);
    setOptedInClubs([]);
    setDbReadNotices([]);
    setDbBookmarkedNotices([]);
    setDbFresherChecklist({});
    setNotifications([]);
    
    localStorage.removeItem('pm_auth_token');
    localStorage.removeItem('pm_user');
    localStorage.removeItem('pm_onboarded');
    localStorage.removeItem('pm_student_data');
    localStorage.removeItem('pm_checklist');
    localStorage.removeItem('pm_custom_checklist');
    localStorage.removeItem('pm_connected_roommates');
    localStorage.removeItem('pm_roommate_requests');
    localStorage.removeItem('pm_opted_in_clubs');
    localStorage.removeItem('pm_lang');
    localStorage.removeItem('pm_chat_history');
    localStorage.removeItem('pm_read_notices');
    localStorage.removeItem('pm_bookmarked_notices');
    localStorage.removeItem('pm_fresher_checklist');
    
    // Clean all user-specific chat history items in localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('pm_chat_history_')) {
        localStorage.removeItem(key);
      }
    });
  };

  const toggleOptInClub = (clubId) => {
    setOptedInClubs(prev => 
      prev.includes(clubId) ? prev.filter(id => id !== clubId) : [...prev, clubId]
    );
  };

  const toggleChecklistItem = (id) => {
    setCompletedChecklist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const addCustomChecklistItem = (item) => {
    setCustomChecklist(prev => [...prev, item]);
  };

  const removeCustomChecklistItem = (id) => {
    setCustomChecklist(prev => prev.filter(item => item.id !== id));
  };

  const requestRoommateConnection = (id) => {
    setRoommateRequests(prev => {
      if (prev.includes(id)) return prev;
      
      // Simulate potential mutual connection. Let's make it so that requesting connection
      // has a 50% chance of instantly matching and revealing contact info after a small delay.
      setTimeout(() => {
        setConnectedRoommates(current => {
          if (!current.includes(id)) {
            // Add to connected roommates
            const updated = [...current, id];
            localStorage.setItem('pm_connected_roommates', JSON.stringify(updated));
            return updated;
          }
          return current;
        });
      }, 1500);

      return [...prev, id];
    });
  };

  // Generate combined checklist based on user selections
  const getCombinedChecklist = () => {
    let items = [];

    // Add matching club/event checklist items dynamically only if opted-in
    const optedClubs = fetchedClubsEvents.filter(c => optedInClubs.includes(c.id));
    optedClubs.forEach(club => {
      items.push({
        id: `chk-club-${club.id}`,
        title: `${club.name} Registration`,
        deadline: club.type === 'Event' ? '2026-08-10' : '2026-08-20',
        location: club.location,
        note: `Register for this ${club.type.toLowerCase()}. Requirement: ${club.requirements}. Timings: ${club.timings}. Steps: ${club.registration_steps}`,
        category: 'Club Registration',
        isClubItem: true,
        clubId: club.id
      });
    });

    // Merge custom items
    return [...items, ...customChecklist];
  };

  const getMatchedClubs = () => {
    return fetchedClubsEvents;
  };

  const updateProfile = async (profileData) => {
    if (!token) return;
    try {
      const res = await fetch('/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update profile');
      }
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('pm_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch (err) {
      console.error('updateProfile error:', err.message);
      throw err;
    }
  };

  // ── DB-backed notice read/bookmark helpers ────────────────────────────────
  const markNoticeReadDb = async (noticeId) => {
    if (!noticeId) return;
    const idNum = Number(noticeId);
    if (dbReadNotices.includes(idNum)) return;
    const updated = [...dbReadNotices, idNum];
    setDbReadNotices(updated);
    localStorage.setItem('pm_read_notices', JSON.stringify(updated));
    if (token) {
      try {
        await fetch('/api/state/user-state/read-notice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ noticeId: idNum })
        });
      } catch (e) {
        console.warn('Failed to sync notice read to DB:', e.message);
      }
    }
  };

  const toggleNoticeBookmarkDb = async (noticeId) => {
    if (!noticeId) return;
    const idNum = Number(noticeId);
    const isBookmarked = dbBookmarkedNotices.includes(idNum);
    const updated = isBookmarked
      ? dbBookmarkedNotices.filter(id => id !== idNum)
      : [...dbBookmarkedNotices, idNum];
    setDbBookmarkedNotices(updated);
    localStorage.setItem('pm_bookmarked_notices', JSON.stringify(updated));
    if (token) {
      try {
        await fetch('/api/state/user-state/bookmark-notice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ noticeId: idNum, action: isBookmarked ? 'unbookmark' : 'bookmark' })
        });
      } catch (e) {
        console.warn('Failed to sync bookmark to DB:', e.message);
      }
    }
  };

  const toggleFresherChecklistDb = async (taskId, isDone) => {
    const updated = { ...dbFresherChecklist, [taskId]: isDone };
    setDbFresherChecklist(updated);
    localStorage.setItem('pm_fresher_checklist', JSON.stringify(updated));
    if (token) {
      try {
        await fetch('/api/state/user-state/checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ taskId, isDone })
        });
      } catch (e) {
        console.warn('Failed to sync checklist to DB:', e.message);
      }
    }
  };

  const markNotificationRead = async (notificationId) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/state/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === parseInt(notificationId) ? { ...n, is_read: true } : n)
        );
      }
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  };

  return (
    <AppContext.Provider value={{
      token,
      user,
      setUser,
      onboarded,
      studentData,
      language,
      setLanguage: changeLanguage,
      t,
      initializing,
      showSplash,
      completedChecklist,
      toggleChecklistItem,
      addCustomChecklistItem,
      removeCustomChecklistItem,
      roommateRequests,
      connectedRoommates,
      requestRoommateConnection,
      completeOnboarding,
      resetAllData,
      getCombinedChecklist,
      getMatchedClubs,
      fetchedClubsEvents,
      refetchClubsEvents,
      optedInClubs,
      toggleOptInClub,
      updateProfile,
      // DB-backed state
      dbReadNotices,
      dbBookmarkedNotices,
      dbFresherChecklist,
      markNoticeReadDb,
      toggleNoticeBookmarkDb,
      toggleFresherChecklistDb,
      notifications,
      setNotifications,
      markNotificationRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
