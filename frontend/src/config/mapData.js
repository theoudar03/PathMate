export const CAMPUS_MAP_DATA = [
  {
    id: "ks-block",
    svg_id: "ks-block",
    name: "KS Block",
    category: "Academic",
    shape: "rect",
    coords: { x: 450, y: 540, w: 130, h: 70 },
    departments: ["ECE", "EEE", "ICE"],
    description: "Secretary K. Santhanam Block. Key academic block hosting digital labs, classrooms, and HOD chambers for Electrical and Electronics disciplines."
  },
  {
    id: "rv-block",
    svg_id: "rv-block",
    name: "RV Block",
    category: "Academic",
    shape: "rect",
    coords: { x: 600, y: 500, w: 165, h: 70 },
    departments: ["CSE", "IT", "Mathematics", "Principal Office", "COE"],
    description: "RV Block. Houses primary administrative services, Principal chamber, first year academic classes, COE exam cell, and CSE labs."
  },
  {
    id: "bd-block",
    svg_id: "bd-block",
    name: "BD Block",
    category: "Academic",
    shape: "rect",
    coords: { x: 600, y: 340, w: 165, h: 50 },
    departments: ["AI&DS", "AI&ML", "CSBS", "Main Library"],
    description: "BD Block. The computing innovation hub. Houses AI&DS and AIML research labs, CSBS wing, and the Central Library ground floor."
  },
  {
    id: "js-block",
    svg_id: "js-block",
    name: "JS Block",
    category: "Academic",
    shape: "rect",
    coords: { x: 600, y: 395, w: 165, h: 55 },
    departments: ["Civil Engineering", "Santhanam Auditorium"],
    description: "JS Block. Dedicated to Civil Engineering theory classrooms, structural design labs, and the high-capacity Santhanam Auditorium."
  },
  {
    id: "me-block",
    svg_id: "me-block",
    name: "ME Block",
    category: "Academic",
    shape: "rect",
    coords: { x: 450, y: 275, w: 130, h: 45 },
    departments: ["Mechanical Engineering"],
    description: "ME Block. Ground-floor mechanical learning wing housing theoretical draft rooms, labs, and fluid dynamics chambers."
  },
  {
    id: "boys-hostel",
    svg_id: "boys-hostel",
    name: "Boys Hostel",
    category: "Hostel",
    shape: "rect",
    coords: { x: 520, y: 40, w: 240, h: 120 },
    departments: ["Residential block"],
    description: "Boys Hostel. Multi-block student housing block for male engineering students, equipped with study halls, dining mess, and sports yards."
  },
  {
    id: "main-cricket",
    svg_id: "main-cricket",
    name: "Main Cricket Ground",
    category: "Sports",
    shape: "ellipse",
    coords: { cx: 220, cy: 100, rx: 180, ry: 70 },
    departments: ["Outdoor Sports"],
    description: "Main Cricket Ground. International standard turf pitch hosting annual inter-collegiate tournaments and sports track assemblies."
  },
  {
    id: "cricket-ground-2",
    svg_id: "cricket-ground-2",
    name: "Cricket Ground 2",
    category: "Sports",
    shape: "rect",
    coords: { x: 30, y: 365, w: 270, h: 295 },
    departments: ["Practice Field"],
    description: "Cricket Practice Field 2. Used for junior training, nets practice, and physical education drills."
  },
  {
    id: "cricket-ground-1",
    svg_id: "cricket-ground-1",
    name: "Cricket Ground 1",
    category: "Sports",
    shape: "rect",
    coords: { x: 30, y: 730, w: 270, h: 220 },
    departments: ["Practice nets"],
    description: "Cricket Practice Field 1. Large bottom-field for nets sessions and internal league matches."
  },
  {
    id: "tnsca-office",
    svg_id: "tnsca-office",
    name: "TNSCA Trichy Office",
    category: "Services",
    shape: "rect",
    coords: { x: 30, y: 240, w: 270, h: 100 },
    departments: ["Administrative Bureau"],
    description: "Trichy District Cricket Association admin headquarters. Manages local league matches and university cricket selections."
  },
  {
    id: "mech-workshop",
    svg_id: "mech-workshop",
    name: "Mechanical Workshop",
    category: "Academic",
    shape: "rect",
    coords: { x: 450, y: 230, w: 130, h: 35 },
    departments: ["Mechanical Practice"],
    description: "Mechanical Engineering Workshop. Practice lab for carpentry, fitting, welding, and sheet metal works."
  },
  {
    id: "cafeteria",
    svg_id: "cafeteria",
    name: "Cafeteria",
    category: "Services",
    shape: "rect",
    coords: { x: 450, y: 330, w: 130, h: 45 },
    departments: ["Dining"],
    description: "SCE Main Cafeteria. Freshly cooked vegetarian lunches, breakfast, juices, and tea service. Opening hours: 8:00 AM - 5:00 PM."
  },
  {
    id: "stationery",
    svg_id: "stationery",
    name: "Stationery Shop",
    category: "Services",
    shape: "rect",
    coords: { x: 455, y: 385, w: 130, h: 30 },
    departments: ["Academic supplies"],
    description: "Campus Stationery shop. Sell note records, blueprints, lab manuals, tools, and printing/copying services."
  },
  {
    id: "generator-room",
    svg_id: "generator-room",
    name: "Generator Room",
    category: "Utilities",
    shape: "rect",
    coords: { x: 450, y: 420, w: 130, h: 35 },
    departments: ["Power Grid"],
    description: "Campus Power Substation. Houses high-voltage generator backups to ensure uninterrupted lab power."
  },
  {
    id: "mech-lab",
    svg_id: "mech-lab",
    name: "Mechanical Lab",
    category: "Academic",
    shape: "rect",
    coords: { x: 450, y: 465, w: 130, h: 35 },
    departments: ["Thermal / Fluid dynamics"],
    description: "Mechanical Lab complex. Thermal engineering test engines, fluid mechanics pumps, and lathe machining workshops."
  },
  {
    id: "bus-boarding",
    svg_id: "bus-boarding",
    name: "Bus Boarding Point",
    category: "Transport",
    shape: "rect",
    coords: { x: 600, y: 240, w: 165, h: 80 },
    departments: ["Transport Bay"],
    description: "Main College Bus Bay. Boarding point for the 25+ university buses connecting campus to Trichy, Tanjore, and Pudukkottai."
  },
  {
    id: "temple",
    svg_id: "temple",
    name: "Ganesha Temple",
    category: "Religious",
    shape: "rect",
    coords: { x: 630, y: 590, w: 100, h: 40 },
    departments: ["Shrine"],
    description: "Ganesha Temple. Campus shrine situated near the main walkway. A traditional spot where students pray before examinations."
  },
  {
    id: "volleyball-court",
    svg_id: "volleyball-court",
    name: "Volleyball Court",
    category: "Sports",
    shape: "rect",
    coords: { x: 450, y: 730, w: 190, h: 70 },
    departments: ["Outdoor Sports"],
    description: "Volleyball court. Sand pit court hosting college league and district sports selections."
  },
  {
    id: "basketball-court",
    svg_id: "basketball-court",
    name: "Basketball Court",
    category: "Sports",
    shape: "rect",
    coords: { x: 660, y: 730, w: 100, h: 70 },
    departments: ["Outdoor Sports"],
    description: "Basketball court. Fitted with LED floodlights and standard acrylic backboards for evening tournaments."
  },
  {
    id: "football-ground",
    svg_id: "football-ground",
    name: "Football Ground",
    category: "Sports",
    shape: "rect",
    coords: { x: 470, y: 820, w: 210, h: 80 },
    departments: ["Outdoor Sports"],
    description: "Football Field. Natural grass court used for football practice and annual athletic meets."
  },
  {
    id: "tennis-court",
    svg_id: "tennis-court",
    name: "Tennis Court",
    category: "Sports",
    shape: "rect",
    coords: { x: 700, y: 810, w: 70, h: 90 },
    departments: ["Outdoor Sports"],
    description: "Tennis court. Synthetic hard court equipped for singles and doubles tournaments."
  },
  {
    id: "security-room",
    svg_id: "security-room",
    name: "Security Room",
    category: "Services",
    shape: "rect",
    coords: { x: 450, y: 915, w: 80, h: 35 },
    departments: ["Main gate security"],
    description: "Main Security Desk. Visitor entry logging, visitor passes, and campus CCTV monitoring room."
  },
  {
    id: "parking-lot",
    svg_id: "parking-lot",
    name: "Parking Lot",
    category: "Transport",
    shape: "rect",
    coords: { x: 550, y: 915, w: 220, h: 40 },
    departments: ["Two-wheelers & Cars"],
    description: "Main Parking area. Covered shelter for staff and student two-wheelers and cars."
  },
  {
    id: "toilet",
    svg_id: "toilet",
    name: "Toilet Block",
    category: "Utilities",
    shape: "rect",
    coords: { x: 50, y: 870, w: 70, h: 45 },
    departments: ["Restrooms"],
    description: "Sports field restrooms. Public washrooms for sports participants and ground visitors."
  },
  {
    id: "atm",
    svg_id: "atm",
    name: "CUB ATM",
    category: "Services",
    shape: "rect",
    coords: { x: 480, y: 620, w: 60, h: 40 },
    departments: ["Banking Services"],
    description: "24/7 support City Union Bank (CUB) ATM. Cash withdrawal services for students and staff."
  }
];

export const LEGEND_CATEGORIES = [
  { key: "Academic", label: "Academic", icon: "school", color: "#1B4DA6" },
  { key: "Hostel", label: "Hostel", icon: "hotel", color: "#3F51B5" },
  { key: "Sports", label: "Sports", icon: "sports_cricket", color: "#2E7D32" },
  { key: "Transport", label: "Transport", icon: "directions_bus", color: "#607D8B" },
  { key: "Utilities", label: "Utilities", icon: "build", color: "#757575" },
  { key: "Services", label: "Services", icon: "storefront", color: "#E65100" },
  { key: "Religious", label: "Religious", icon: "temple_hindu", color: "#FFA000" }
];
