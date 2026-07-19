export const STUDY_HUB_CONFIG = {
  wifiPortalUrl: "http://192.168.1.1:8090", // Configurable campus Wi-Fi login portal URL
  instagramUrl: "https://www.instagram.com/saranathan_college_official/", // Configurable official Instagram URL
  saraSellUrl: "https://sarasell.netlify.app/", // netlify trade marketplace
  questionPapersDriveUrl: "https://drive.google.com/drive/folders/1jgUywox4M9qGfXDoRf-UMVrFfaKvruOm", // QP Drive Link
  
  // Curriculum & Syllabus Drive Links per department
  departments: [
    {
      id: "aids",
      name: "AI & DS",
      curriculumUrl: "https://drive.google.com/file/d/1FXw_yVW-gk5wCiB-I0WDcsmSOAaBThM1/view",
      syllabusUrl: "https://drive.google.com/file/d/1jEfXpfnVwoIDZsMgtuiZmVtCG29DfH-G/view"
    },
    {
      id: "aiml",
      name: "AI & ML",
      curriculumUrl: "https://drive.google.com/file/d/1P_8jCJCojJJqIkrl-QAcarMnULXo2m10/view",
      syllabusUrl: "https://drive.google.com/file/d/1JXsRjpaSHQ8gQk-WSXAhxb-Q5k2zZsh8/view"
    },
    {
      id: "cse",
      name: "CSE",
      curriculumUrl: "https://drive.google.com/file/d/1Fe9apZyuuFypcTwg6kHkIRPKQGDLtOPW/view",
      syllabusUrl: "https://drive.google.com/file/d/1Fe9apZyuuFypcTwg6kHkIRPKQGDLtOPW/view"
    },
    {
      id: "csbs",
      name: "CSBS",
      curriculumUrl: "https://drive.google.com/file/d/14STU50dhjEs5ssm-PYFO_xx2VmPmEJxg/view",
      syllabusUrl: "https://drive.google.com/file/d/14STU50dhjEs5ssm-PYFO_xx2VmPmEJxg/view"
    },
    {
      id: "it",
      name: "IT",
      curriculumUrl: "https://drive.google.com/file/d/1JZfQWcitxeixzgujcHXlIgD_sBE6sQ8P/view",
      syllabusUrl: "https://drive.google.com/file/d/1CRECgxjD89OCeS6m5TTmP1xQYHBfIc_B/view"
    },
    {
      id: "ece",
      name: "ECE",
      curriculumUrl: "https://drive.google.com/file/d/1qxewU6JLRp5tqSRqYOlwVyvoY_AA4y8x/view",
      syllabusUrl: "https://drive.google.com/file/d/1Z1rQBZKSbrJYNT_7Mp6RtK9Ng4JKvRui/view"
    },
    {
      id: "eee",
      name: "EEE",
      curriculumUrl: "https://drive.google.com/file/d/1BazKOpdXOxaofyohkCZEbXag02WXP9zx/view",
      syllabusUrl: "https://drive.google.com/file/d/1CGxaPU0TycmU8oF25AwoWSLIWDk8sxhO/view"
    },
    {
      id: "ice",
      name: "ICE",
      curriculumUrl: "https://drive.google.com/file/d/1Xgk4hRiQVk6IMcTPXq7s1_6hEYwLq7m5/view",
      syllabusUrl: "https://drive.google.com/file/d/124-LBVtwYOXXnxcZCqCpc_sx4c05CblJ/view"
    },
    {
      id: "civil",
      name: "Civil",
      curriculumUrl: "https://drive.google.com/file/d/13EKzWLk4dGRosgfP8n-G9FeYPebhDGSb/view",
      syllabusUrl: "https://drive.google.com/file/d/1Z-vfSk5dQ8mBc1IixUdxzy8aYnHEIjGk/view"
    },
    {
      id: "mechanical",
      name: "Mechanical",
      curriculumUrl: "https://drive.google.com/file/d/1O9W4QTDEu-sOMt5oMEFG8Eepd7VlT1PS/view",
      syllabusUrl: "https://drive.google.com/file/d/1-r6192w59R8n3UbVPHF08rVZSz3VBsIA/view"
    },
    {
      id: "mba",
      name: "MBA",
      curriculumUrl: "https://drive.google.com/file/d/1ICAUhfVXuUA7M39WzjSunIXfavD2px1w/view",
      syllabusUrl: "https://drive.google.com/file/d/1ICAUhfVXuUA7M39WzjSunIXfavD2px1w/view"
    }
  ],

  // YouTube channels and links configured for study recommendations
  learningResources: {
    programming: [
      { name: "freeCodeCamp.org", desc: "Full developer courses on Python, Web, Java", url: "https://www.youtube.com/@freecodecamp" },
      { name: "GeeksforGeeks", desc: "Data structures, algorithms & coding concepts", url: "https://www.youtube.com/@GeeksforGeeksVideos" },
      { name: "Apna College", desc: "C++, Java Placement resources & guide series", url: "https://www.youtube.com/@ApnaCollegeOfficial" }
    ],
    electronics: [
      { name: "Neso Academy", desc: "Excellent digital electronics & signal tutorials", url: "https://www.youtube.com/@nesoacademy" },
      { name: "All About Circuits", desc: "Practical electronics experiments and basics", url: "https://www.youtube.com/@allaboutcircuits" },
      { name: "GreatScott!", desc: "DIY electronics projects & engineering hacks", url: "https://www.youtube.com/@greatscottlab" }
    ],
    mathematics: [
      { name: "3Blue1Brown", desc: "Visualizing calculus, linear algebra & equations", url: "https://www.youtube.com/@3blue1brown" },
      { name: "PatrickJMT", desc: "Straight-to-the-point algebra & calculus solvers", url: "https://www.youtube.com/@patrickjmt" },
      { name: "Khan Academy", desc: "Fundamental math, derivatives & probability", url: "https://www.youtube.com/@khanacademy" }
    ],
    aptitude: [
      { name: "Feel Free to Learn", desc: "Logical reasoning & quantitative mock series", url: "https://www.youtube.com/@feelfreetolearn" },
      { name: "CareerRide", desc: "Topic-wise placement test questions explained", url: "https://www.youtube.com/@CareerRide" }
    ],
    placement: [
      { name: "PrepInsta", desc: "Accenture, TCS, Cognizant, Zoho preparation guides", url: "https://www.youtube.com/@PrepInsta" },
      { name: "Love Babbar", desc: "Famous DSA Cheat Sheet & coding placements guide", url: "https://www.youtube.com/@LoveBabbar" },
      { name: "Striver (takeUforward)", desc: "SDE placement roadmap, trees, graphs solutions", url: "https://www.youtube.com/@takeUforward" }
    ],
    gate: [
      { name: "GATE Academy", desc: "HOD-led GATE syllabus preparation lectures", url: "https://www.youtube.com/@GATEACADEMY" },
      { name: "Gate Smashers", desc: "Easy explanations for DBMS, OS, Compiler Design", url: "https://www.youtube.com/@GateSmashers" }
    ]
  }
};
