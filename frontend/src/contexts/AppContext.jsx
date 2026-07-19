import React, { createContext, useContext, useState, useEffect } from 'react';
import { LOCALIZATION_DICTS } from '../utils/localization';

const AppContext = createContext();

// Mock Data for SCE Clubs & Events
export const CLUBS_DATA = [
  {
    id: 'coding-club',
    name: 'SCE Coding Club',
    description: 'A community of passionate programmers and developers at SCE. We host hackathons, codathons, and weekly programming workshops.',
    reason: 'Matches your interest in technology and software development. Coding is critical for your department.',
    category: 'Technical',
    type: 'Club',
    location: 'Santhanam Block, Lab 3 (2nd Floor)',
    requirements: 'Basic curiosity about problem-solving. No prior coding experience required.',
    timings: 'Tuesdays and Thursdays, 4:15 PM - 5:30 PM'
  },
  {
    id: 'robotics',
    name: 'SCE Robotics & Automation Society',
    description: 'Build robots, micro-controllers, and automation systems. Combines hardware development, embedded coding, and structural design.',
    reason: 'Complements your interest in hardware-software integration and hands-on laboratory experiments.',
    category: 'Technical',
    type: 'Club',
    location: 'Main Lab Block, Embedded Systems Lab (Ground Floor)',
    requirements: 'Open to all branches. Enthusiasm for electronics and physical building.',
    timings: 'Wednesdays, 4:15 PM - 6:00 PM'
  },
  {
    id: 'fine-arts',
    name: 'SCE Fine Arts Club (FAC)',
    description: 'The creative hub of Saranathan College. Focuses on painting, sketching, music, photography, and theater performances during college cultural festivals.',
    reason: 'Matches your artistic side and creative interests expressed during onboarding.',
    category: 'Cultural',
    type: 'Club',
    location: 'Open Air Theatre (OAT) & FAC Room (Admin Block Annex)',
    requirements: 'Passion for performance, music, arts, or media.',
    timings: 'Fridays, 4:00 PM - 5:30 PM'
  },
  {
    id: 'english-literary',
    name: 'English Literary Club (ELC)',
    description: 'Enhances public speaking, debate, creative writing, and group discussions. A wonderful place to build confidence for placements.',
    reason: 'Supports your goal to improve communications, soft skills, and professional networking.',
    category: 'Literary',
    type: 'Club',
    location: 'Library Seminar Hall (1st Floor)',
    requirements: 'A love for reading, speaking, writing, or debate.',
    timings: 'Mondays, 4:15 PM - 5:15 PM'
  },
  {
    id: 'tamil-mandram',
    name: 'தமிழ் இலக்கிய மன்றம் (Tamil Literary Association)',
    description: 'Celebrating the richness of Tamil language, poetry, drama, and debating. We organize annual state-level competitions.',
    reason: 'Matches your selected preference for Tamil cultural activities and regional literature.',
    category: 'Cultural/Literary',
    type: 'Club',
    location: 'RV Auditorium (Admin Block)',
    requirements: 'Basic appreciation for Tamil arts, speaking, or poetry.',
    timings: 'Thursdays, 4:15 PM - 5:30 PM'
  },
  {
    id: 'nss-yrc',
    name: 'NSS & Youth Red Cross (YRC)',
    description: 'Dedicated to community service, blood donation camps, environmental awareness drives, and rural development camps around Trichy.',
    reason: 'Aligns with your choice to engage in social work, volunteering, and civic action.',
    category: 'Social Service',
    type: 'Club',
    location: 'NSS Office (Civil Block Ground Floor)',
    requirements: 'Commitment to attend weekend volunteering camps.',
    timings: 'Alternate Saturdays, 9:00 AM - 1:00 PM'
  },
  {
    id: 'sports-council',
    name: 'SCE Sports Council & Gymkhana',
    description: 'Oversees college sports teams (Cricket, Football, Basketball, Volleyball, Badminton, Athletics) and manages fitness facilities.',
    reason: 'Matches your focus on sports, physical fitness, and representing SCE in inter-collegiate matches.',
    category: 'Sports',
    type: 'Club',
    location: 'SCE Playgrounds & Indoor Sports Complex',
    requirements: 'Selection trials for varsity teams. Open recreation for others.',
    timings: 'Daily, 4:30 PM - 6:30 PM'
  },
  {
    id: 'orientation-event',
    name: 'SCE Freshman Orientation Day',
    description: 'The official inaugural orientation ceremony welcoming the Batch of 2026. Meet department coordinators and obtain syllabus sheets.',
    reason: 'Key institutional event to introduce campus standards, safety rules, and your direct HOD team.',
    category: 'Academic/Social',
    type: 'Event',
    location: 'RV Auditorium (Admin Block)',
    requirements: 'Recommended attire: formal. Open to all registered freshers.',
    timings: 'August 3rd, 9:00 AM - 1:00 PM'
  },
  {
    id: 'hackathon-event',
    name: 'SCE Code-Storm Hackathon',
    description: 'A rapid 24-hour programming and prototype sprint designed exclusively for first-year engineering students to build early projects.',
    reason: 'Curated code event matching your technical goals. Excellent for collaborating and choosing team-partners.',
    category: 'Technical',
    type: 'Event',
    location: 'Central Computing Lab, Santhanam Block',
    requirements: 'Bring your laptop. Basic coding syntax curiosity is sufficient.',
    timings: 'August 14th, 9:00 AM - August 15th, 9:00 AM'
  },
  {
    id: 'cultural-fest',
    name: 'SCE Symphony Culturals 2026',
    description: 'The annual freshman talent search fest, featuring stage presentations, vocal music, drama contests, sketching, and arts exhibits.',
    reason: 'Matches your hobbies and creative profile interests. Build confidence and display your artistry early.',
    category: 'Cultural',
    type: 'Event',
    location: 'Open Air Theatre (OAT)',
    requirements: 'Registration form submission required at the FAC room.',
    timings: 'August 22nd, 2:00 PM - 6:30 PM'
  }
];

// Data fetching states
  const [potentialRoommates, setPotentialRoommates] = useState([]);
  const [seniorMentors, setSeniorMentors] = useState([]);
  const [departmentsData, setDepartmentsData] = useState([]);
  const [facultyData, setFacultyData] = useState([]);

  useEffect(() => {
    // Fetch live data from backend
    const fetchData = async () => {
      try {
        const [rmRes, mentorRes, deptRes, facRes] = await Promise.all([
          fetch('/api/roommates'),
          fetch('/api/mentors'),
          fetch('/api/departments'),
          fetch('/api/faculty')
        ]);
        
        if (rmRes.ok) setPotentialRoommates(await rmRes.json());
        if (mentorRes.ok) setSeniorMentors(await mentorRes.json());
        if (deptRes.ok) setDepartmentsData(await deptRes.json());
        if (facRes.ok) setFacultyData(await facRes.json());
      } catch (err) {
        console.error("Failed to fetch live data:", err);
      }
    };
    fetchData();
  }, []);


export const AppProvider = ({ children }) => {
  // Authentication State
  const [token, setToken] = useState(() => {
    return localStorage.getItem('pm_auth_token') || null;
  });

  const [user, setUser] = useState(() => {
    const data = localStorage.getItem('pm_user');
    return data ? JSON.parse(data) : null;
  });

  const [onboarded, setOnboarded] = useState(() => {
    return localStorage.getItem('pm_onboarded') === 'true';
  });

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
        timings: 'TBD'
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
        timings: e.event_date ? new Date(e.event_date).toLocaleString() : 'TBD'
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
        }
      })
      .catch(err => {
        console.warn("Session expired or invalid. Logging out:", err.message);
        resetAllData();
      })
      .finally(() => {
        setInitializing(false);
      });
    } else {
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
    const optedClubs = CLUBS_DATA.filter(c => optedInClubs.includes(c.id));
    optedClubs.forEach(club => {
      items.push({
        id: `chk-club-${club.id}`,
        title: `${club.name} Registration`,
        deadline: club.type === 'Event' ? '2026-08-10' : '2026-08-20',
        location: club.location,
        note: `Register for this ${club.type.toLowerCase()}. Requirement: ${club.requirements}. Timings: ${club.timings}.`,
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
