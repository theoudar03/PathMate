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
      onboardingCompletedAt: u?.created_at || ''
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

  const [initializing, setInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [fetchedClubsEvents, setFetchedClubsEvents] = useState([]);

  // Fetch real clubs and events on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/clubs').then(res => res.json()),
      fetch('/api/events').then(res => res.json()),
      fetch('/api/committees').then(res => res.json())
    ])
    .then(([clubs, events, committees]) => {
      const formattedClubs = clubs.map(c => ({
        id: `club-${c.id}`,
        name: c.name,
        description: c.description,
        reason: 'Curated club from DB',
        category: 'Club',
        type: 'Club',
        location: c.location_text || 'TBD',
        requirements: c.eligibility || 'Open to all',
        timings: 'TBD',
        registration_steps: c.registration_steps || 'Please contact the coordinator.'
      }));
      const formattedEvents = events.map(e => ({
        id: `event-${e.id}`,
        name: e.name || e.title,
        description: e.description || e.name,
        reason: 'Upcoming campus event',
        category: 'Event',
        type: 'Event',
        location: e.location_text || e.location || 'TBD',
        requirements: 'Open to all',
        timings: e.event_date ? new Date(e.event_date).toLocaleString() : 'TBD',
        registration_steps: e.registration_steps || 'Registration details pending.'
      }));
      const formattedCommittees = committees.map(c => ({
        id: `comm-${c.id}`,
        name: c.name,
        description: c.description || '',
        reason: 'Official College Committee',
        category: 'Committee',
        type: 'Committee',
        location: 'TBD',
        requirements: 'Open to interested students',
        timings: 'TBD'
      }));
      setFetchedClubsEvents([...formattedClubs, ...formattedEvents, ...formattedCommittees]);
    })
    .catch(err => console.error('Failed to fetch clubs/events/committees:', err));
  }, []);

  // Verify auth token once on initial startup load
  useEffect(() => {
    if (token) {
      fetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Token validation failed');
        return res.json();
      })
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('pm_user', JSON.stringify(data.user));
          setOnboarded(true);
          if (data.user.preferred_language) {
            setLanguage(data.user.preferred_language);
            localStorage.setItem('pm_lang', data.user.preferred_language);
          }
        } else {
          throw new Error('Invalid user payload');
        }
      })
      .catch(err => {
        console.warn("Session expired or invalid token. Clearing session:", err.message);
        resetAllData();
      })
      .finally(() => {
        setInitializing(false);
      });
    } else {
      resetAllData();
      setInitializing(false);
    }
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
        onboardingCompletedAt: user.created_at || ''
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
    if (!onboarded) return [];
    
    // For now, return all fetched DB items. If filtering is needed by interests, 
    // it can be done here. Since the user wants to see the real DB data, we return it all.
    return fetchedClubsEvents;
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
      optedInClubs,
      toggleOptInClub
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
